const pool = require('../config/db');
const { getSchoolPackageState } = require('./packageFeatureService');

const REQUIRED_DOCUMENTS = [
  {
    key: 'parent_guardian_id',
    label: 'Parent/Guardian ID',
    scope: 'family',
    aliases: ['Parent/Guardian ID', 'Parent License', 'Parent ID', 'Guardian ID', 'Driver License', 'Driving License'],
  },
  {
    key: 'vehicle_photo',
    label: 'Vehicle Photo',
    scope: 'family',
    aliases: ['Vehicle Photo', 'Vehicle Photos', 'Car Photo'],
  },
  {
    key: 'child_photo',
    label: 'Child Photo',
    scope: 'child',
    aliases: ['Child Photo', 'Student Photo'],
  },
];

const OPTIONAL_DOCUMENT_TYPES = [
  'Insurance Card',
  'School ID',
  'Medical Form',
  'Custody / Legal Document',
  'Other',
];

const normalizeText = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const normalizeStatus = (value = '') => {
  const status = normalizeText(value);
  if (status === 'approved' || status === 'verified') return 'approved';
  if (status === 'rejected' || status === 'denied') return 'rejected';
  return 'pending';
};

const statusForClient = (value = '') => {
  const status = normalizeStatus(value);
  return status === 'approved' ? 'verified' : status;
};

const canonicalizeDocumentType = (type = '') => {
  const normalized = normalizeText(type);
  for (const requirement of REQUIRED_DOCUMENTS) {
    if (requirement.aliases.some((alias) => normalized === normalizeText(alias))) {
      return requirement.label;
    }

    if (requirement.scope === 'child' && requirement.aliases.some((alias) => normalized.startsWith(normalizeText(alias)))) {
      return type;
    }
  }

  return String(type || '').trim();
};

const isRequiredDocumentType = (type = '') => {
  const normalized = normalizeText(type);
  return REQUIRED_DOCUMENTS.some((requirement) =>
    requirement.aliases.some((alias) => normalized === normalizeText(alias) || normalized.startsWith(normalizeText(alias)))
  );
};

const matchesRequirement = (doc, requirement) => {
  const normalizedType = normalizeText(doc.type || doc.name);
  return requirement.aliases.some((alias) => {
    const normalizedAlias = normalizeText(alias);
    return normalizedType === normalizedAlias || normalizedType.startsWith(`${normalizedAlias} `) || normalizedType.startsWith(`${normalizedAlias}(`);
  });
};

const describeLatestStatus = (documents) => {
  if (!documents.length) {
    return {
      uploaded: false,
      approved: false,
      status: 'missing',
      documentId: null,
      rejectionReason: null,
      uploadedAt: null,
    };
  }

  const approved = documents.find((doc) => normalizeStatus(doc.status) === 'approved');
  if (approved) {
    return {
      uploaded: true,
      approved: true,
      status: 'verified',
      documentId: approved.id,
      rejectionReason: null,
      uploadedAt: approved.uploaded_at,
    };
  }

  const pending = documents.find((doc) => normalizeStatus(doc.status) === 'pending');
  if (pending) {
    return {
      uploaded: true,
      approved: false,
      status: 'pending',
      documentId: pending.id,
      rejectionReason: null,
      uploadedAt: pending.uploaded_at,
    };
  }

  const rejected = documents.find((doc) => normalizeStatus(doc.status) === 'rejected') || documents[0];
  return {
    uploaded: true,
    approved: false,
    status: 'rejected',
    documentId: rejected.id,
    rejectionReason: rejected.rejection_reason || null,
    uploadedAt: rejected.uploaded_at,
  };
};

const getParentRecord = async (executor, parentId) => {
  const [[parent]] = await executor.execute(
    `SELECT id, school_id, firstName, lastName, email, phone
     FROM users
     WHERE id = ? AND role = 'parent'`,
    [parentId]
  );
  return parent || null;
};

const getFamilyDocumentVerificationStatus = async (parentId, options = {}) => {
  const executor = options.executor || pool;
  const parent = await getParentRecord(executor, parentId);

  if (!parent) {
    const error = new Error('Parent account was not found.');
    error.statusCode = 404;
    error.code = 'PARENT_NOT_FOUND';
    throw error;
  }

  const [children] = await executor.execute(
    `SELECT id, full_name
     FROM children
     WHERE user_id = ?
     ORDER BY id ASC`,
    [parentId]
  );

  const [documents] = await executor.execute(
    `SELECT id, user_id, child_id, type, file_path, required, status, uploaded_at, rejection_reason
     FROM documents
     WHERE user_id = ?
     ORDER BY uploaded_at DESC, id DESC`,
    [parentId]
  );

  const familyRequirements = REQUIRED_DOCUMENTS.filter((requirement) => requirement.scope === 'family').map((requirement) => {
    const matches = documents.filter((doc) => matchesRequirement(doc, requirement));
    return {
      key: requirement.key,
      label: requirement.label,
      scope: requirement.scope,
      ...describeLatestStatus(matches),
    };
  });

  const childRequirement = REQUIRED_DOCUMENTS.find((requirement) => requirement.key === 'child_photo');
  const childRequirements = children.map((child) => {
    const matches = documents.filter(
      (doc) => Number(doc.child_id) === Number(child.id) && matchesRequirement(doc, childRequirement)
    );

    return {
      key: childRequirement.key,
      label: childRequirement.label,
      scope: childRequirement.scope,
      childId: child.id,
      childName: child.full_name,
      ...describeLatestStatus(matches),
    };
  });

  const required = [...familyRequirements, ...childRequirements];
  const summary = required.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.approved) acc.approved += 1;
      else if (item.status === 'missing') acc.missing += 1;
      else if (item.status === 'rejected') acc.rejected += 1;
      else acc.pending += 1;
      return acc;
    },
    { total: 0, approved: 0, pending: 0, rejected: 0, missing: 0, complete: false }
  );
  summary.complete = summary.total > 0 && summary.approved === summary.total;

  return {
    parentId: parent.id,
    schoolId: parent.school_id,
    parent: {
      id: parent.id,
      name: [parent.firstName, parent.lastName].filter(Boolean).join(' ').trim(),
      email: parent.email,
      phone: parent.phone,
    },
    required,
    summary,
    requiredTypes: REQUIRED_DOCUMENTS.map((doc) => doc.label),
  };
};

const isDocumentVerificationRequiredForParent = async (parentId, options = {}) => {
  const executor = options.executor || pool;
  const parent = await getParentRecord(executor, parentId);

  if (!parent) {
    const error = new Error('Parent account was not found.');
    error.statusCode = 404;
    error.code = 'PARENT_NOT_FOUND';
    throw error;
  }

  const packageState = await getSchoolPackageState(executor, parent.school_id);
  return Boolean(packageState?.feature_toggles?.document_uploads ?? true);
};

const assertFamilyDocumentsApproved = async (parentId, options = {}) => {
  if (options.skipIfFeatureDisabled) {
    const required = await isDocumentVerificationRequiredForParent(parentId, options);
    if (!required) {
      return {
        parentId,
        required: [],
        summary: { total: 0, approved: 0, pending: 0, rejected: 0, missing: 0, complete: true },
        skipped: true,
      };
    }
  }

  const verification = await getFamilyDocumentVerificationStatus(parentId, options);
  if (verification.summary.complete) return verification;

  const error = new Error('Required family documents must be uploaded and approved before QR codes or pickups can be used.');
  error.statusCode = 403;
  error.code = 'DOCUMENT_VERIFICATION_REQUIRED';
  error.verification = verification;
  throw error;
};

module.exports = {
  REQUIRED_DOCUMENTS,
  OPTIONAL_DOCUMENT_TYPES,
  canonicalizeDocumentType,
  getFamilyDocumentVerificationStatus,
  assertFamilyDocumentsApproved,
  isDocumentVerificationRequiredForParent,
  isRequiredDocumentType,
  normalizeStatus,
  statusForClient,
};
