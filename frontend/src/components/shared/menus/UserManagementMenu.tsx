import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  UserPlusIcon, 
  ShieldCheckIcon, 
  UserIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface UserManagementMenuProps {
  role: 'admin' | 'super-admin';
  onAddUser: (type: 'parent' | 'admin' | 'guard') => void;
}

export default function UserManagementMenu({ role, onAddUser }: UserManagementMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="p-2 text-gray-400 hover:text-gray-500 transition-colors group flex items-center gap-1">
          <UserPlusIcon className="h-6 w-6" />
          <ChevronDownIcon 
            className="h-4 w-4 transition-transform group-hover:rotate-180" 
            aria-hidden="true" 
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onAddUser('parent')}
                  className={cn(
                    active ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  )}
                >
                  <UserIcon
                    className="mr-2 h-5 w-5 text-indigo-600"
                    aria-hidden="true"
                  />
                  Add Parent
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => onAddUser('guard')}
                  className={cn(
                    active ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  )}
                >
                  <ShieldCheckIcon
                    className="mr-2 h-5 w-5 text-indigo-600"
                    aria-hidden="true"
                  />
                  Add Guard
                </button>
              )}
            </Menu.Item>
            
            {/* Only show Add Admin option for super admins */}
            {role === 'super-admin' && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onAddUser('admin')}
                    className={cn(
                      active ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700',
                      'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                    )}
                  >
                    <UserPlusIcon
                      className="mr-2 h-5 w-5 text-indigo-600"
                      aria-hidden="true"
                    />
                    Add School Admin
                  </button>
                )}
              </Menu.Item>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
