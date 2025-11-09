"use client";

import { useRouter, usePathname } from "next/navigation";

interface MenuItem {
  label: string;
  path: string;
  icon?: JSX.Element;
}

const menuItems: MenuItem[] = [
  {
    label: "Početna",
    path: "/dashboard",
  },
  {
    label: "Korisnici",
    path: "/dashboard/users",
  },
  {
    label: "Servisi",
    path: "/dashboard/services",
  },
  {
    label: "Konfiguracija",
    path: "/configuration",
  },
];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-8">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`px-4 py-4 font-medium transition-colors ${
                  isActive
                    ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
