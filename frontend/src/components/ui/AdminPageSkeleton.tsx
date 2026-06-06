import "./admin-page-skeleton.css";
import type { CSSProperties } from "react";

export type AdminPageSkeletonVariant =
  | "profiles"
  | "documents"
  | "users"
  | "qr-directory"
  | "qr-codes"
  | "activity"
  | "scanner"
  | "roster"
  | "billing"
  | "settings";

type Props = {
  variant: AdminPageSkeletonVariant;
  label?: string;
};

const lineWidths = ["72%", "56%", "64%", "48%"];

function Block({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`pz-skeleton ${className}`} style={style} />;
}

function HeaderSkeleton() {
  return (
    <div className="pz-admin-skeleton-header">
      <div className="pz-admin-skeleton-heading">
        <Block className="pz-admin-skeleton-kicker" />
        <Block className="pz-admin-skeleton-title" />
        <Block className="pz-admin-skeleton-subtitle" />
      </div>
      <div className="pz-admin-skeleton-header-actions">
        <Block className="pz-admin-skeleton-action" />
        <Block className="pz-admin-skeleton-action short" />
      </div>
    </div>
  );
}

function StatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={`pz-admin-skeleton-stats count-${count}`}>
      {Array.from({ length: count }, (_, index) => (
        <div className="pz-admin-skeleton-stat" key={index}>
          <div className="pz-admin-skeleton-stat-top">
            <Block className="pz-admin-skeleton-line" style={{ width: lineWidths[index % lineWidths.length] }} />
            <Block className="pz-admin-skeleton-stat-icon" />
          </div>
          <Block className="pz-admin-skeleton-stat-value" />
          <Block className="pz-admin-skeleton-line" style={{ width: index % 2 ? "62%" : "74%" }} />
        </div>
      ))}
    </div>
  );
}

function ControlsSkeleton() {
  return (
    <div className="pz-admin-skeleton-controls">
      <div className="pz-admin-skeleton-control-top">
        <Block className="pz-admin-skeleton-search" />
        <div className="pz-admin-skeleton-tabs">
          <Block />
          <Block />
          <Block />
          <Block />
        </div>
      </div>
      <div className="pz-admin-skeleton-control-bottom">
        <Block />
        <Block />
        <Block />
      </div>
    </div>
  );
}

function PanelHeader() {
  return (
    <div className="pz-admin-skeleton-panel-head">
      <div>
        <Block className="pz-admin-skeleton-panel-title" />
        <Block className="pz-admin-skeleton-panel-subtitle" />
      </div>
      <Block className="pz-admin-skeleton-badge" />
    </div>
  );
}

function ListRows({ rows = 4, roomy = false }: { rows?: number; roomy?: boolean }) {
  return (
    <div className="pz-admin-skeleton-list">
      {Array.from({ length: rows }, (_, index) => (
        <div className={`pz-admin-skeleton-list-row ${roomy ? "roomy" : ""}`} key={index}>
          <Block className="pz-admin-skeleton-avatar" />
          <div className="pz-admin-skeleton-row-copy">
            <Block className="pz-admin-skeleton-line" style={{ width: index % 2 ? "48%" : "60%" }} />
            <Block className="pz-admin-skeleton-line" style={{ width: index % 2 ? "76%" : "68%" }} />
            {roomy && (
              <div className="pz-admin-skeleton-row-pills">
                <Block />
                <Block />
                <Block />
              </div>
            )}
          </div>
          <Block className="pz-admin-skeleton-row-action" />
        </div>
      ))}
    </div>
  );
}

function TableRows({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className={`pz-admin-skeleton-table columns-${columns}`}>
      <div className="pz-admin-skeleton-table-head">
        {Array.from({ length: columns }, (_, index) => <Block key={index} />)}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div className="pz-admin-skeleton-table-row" key={row}>
          {Array.from({ length: columns }, (_, column) => (
            <div className={column === 0 ? "pz-admin-skeleton-person-cell" : ""} key={column}>
              {column === 0 && <Block className="pz-admin-skeleton-avatar small" />}
              <Block className="pz-admin-skeleton-line" style={{ width: `${58 + ((row + column) % 3) * 12}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function StandardDirectory({ variant }: { variant: AdminPageSkeletonVariant }) {
  const table = variant === "users" || variant === "activity" || variant === "roster";
  const roomy = variant === "profiles";
  return (
    <>
      <StatGrid />
      {variant !== "roster" && <ControlsSkeleton />}
      <div className={`pz-admin-skeleton-main-grid ${roomy || variant === "users" ? "with-side" : ""}`}>
        <section className="pz-admin-skeleton-panel">
          <PanelHeader />
          {table ? <TableRows columns={variant === "roster" ? 4 : 6} /> : <ListRows roomy={roomy} />}
        </section>
        {(roomy || variant === "users") && (
          <aside className="pz-admin-skeleton-panel">
            <PanelHeader />
            <ListRows rows={3} />
          </aside>
        )}
      </div>
    </>
  );
}

function QrDirectory() {
  return (
    <section className="pz-admin-skeleton-panel">
      <PanelHeader />
      <ListRows rows={5} />
    </section>
  );
}

function ScannerSkeleton() {
  return (
    <>
      <StatGrid />
      <div className="pz-admin-skeleton-main-grid scanner">
        <section className="pz-admin-skeleton-panel">
          <PanelHeader />
          <ListRows rows={3} roomy />
        </section>
        <section className="pz-admin-skeleton-panel">
          <PanelHeader />
          <TableRows rows={4} columns={3} />
        </section>
      </div>
    </>
  );
}

function BillingSkeleton() {
  return (
    <>
      <StatGrid count={3} />
      <div className="pz-admin-skeleton-main-grid billing">
        <section className="pz-admin-skeleton-panel">
          <PanelHeader />
          <ListRows rows={5} />
        </section>
        <section className="pz-admin-skeleton-panel">
          <PanelHeader />
          <ListRows rows={4} />
        </section>
      </div>
      <section className="pz-admin-skeleton-panel">
        <PanelHeader />
        <div className="pz-admin-skeleton-plans">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="pz-admin-skeleton-plan" key={index}>
              <Block className="pz-admin-skeleton-line" style={{ width: "55%" }} />
              <Block className="pz-admin-skeleton-price" />
              <Block className="pz-admin-skeleton-line" style={{ width: "86%" }} />
              <Block className="pz-admin-skeleton-line" style={{ width: "72%" }} />
              <Block className="pz-admin-skeleton-plan-button" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div className="pz-admin-skeleton-main-grid settings">
      <section className="pz-admin-skeleton-panel">
        <PanelHeader />
        <div className="pz-admin-skeleton-profile-preview">
          <Block className="pz-admin-skeleton-photo" />
          <Block className="pz-admin-skeleton-line" style={{ width: "42%" }} />
          <Block className="pz-admin-skeleton-badge" />
          <Block className="pz-admin-skeleton-action" />
        </div>
      </section>
      <section className="pz-admin-skeleton-panel">
        <PanelHeader />
        <div className="pz-admin-skeleton-form">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index}>
              <Block className="pz-admin-skeleton-line" style={{ width: "28%" }} />
              <Block className="pz-admin-skeleton-input" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminPageSkeleton({ variant, label = "Loading page" }: Props) {
  return (
    <div className={`pz-admin-page-skeleton variant-${variant}`} role="status" aria-busy="true" aria-label={label}>
      <HeaderSkeleton />
      {variant === "qr-directory" ? (
        <QrDirectory />
      ) : variant === "qr-codes" ? (
        <>
          <StatGrid />
          <ControlsSkeleton />
          <div className="pz-admin-skeleton-main-grid with-side">
            <section className="pz-admin-skeleton-panel"><PanelHeader /><ListRows rows={3} roomy /></section>
            <aside className="pz-admin-skeleton-panel"><PanelHeader /><ListRows rows={3} /></aside>
          </div>
        </>
      ) : variant === "scanner" ? (
        <ScannerSkeleton />
      ) : variant === "billing" ? (
        <BillingSkeleton />
      ) : variant === "settings" ? (
        <SettingsSkeleton />
      ) : (
        <StandardDirectory variant={variant} />
      )}
    </div>
  );
}
