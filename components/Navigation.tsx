"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface MenuItem {
  label: string;
  path?: string;
  icon?: JSX.Element;
  children?: MenuItem[];
  requiresGospodar?: boolean;
}

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Get user role from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = sessionStorage.getItem("admin-user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      }
    }
  }, []);

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
      children: [
        {
          label: "Istorija servisa",
          path: "/dashboard/services",
        },
        {
          label: "Aktivni serviseri",
          path: "/dashboard/active-technicians",
        },
      ],
    },
    {
      label: "Radni dani",
      path: "/workday",
    },
    {
      label: "Konfiguracija",
      children: [
        {
          label: "Operacije i Delovi",
          path: "/configuration",
        },
        {
          label: "Mobilna aplikacija",
          path: "/mobile-app",
          requiresGospodar: true,
        },
        {
          label: "Portal Update",
          path: "/dashboard/portal-update",
          requiresGospodar: true,
        },
        {
          label: "Backup",
          path: "/backup",
          requiresGospodar: true,
        },
      ],
    },
  ];

  // Filter menu items based on user role
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .map((item) => {
        if (item.children) {
          const filteredChildren = item.children.filter((child) => {
            if (child.requiresGospodar) {
              return userRole === "gospodar";
            }
            return true;
          });

          // If all children are filtered out, don't show the parent
          if (filteredChildren.length === 0) {
            return null;
          }

          return { ...item, children: filteredChildren };
        }

        if (item.requiresGospodar) {
          return userRole === "gospodar" ? item : null;
        }

        return item;
      })
      .filter(Boolean) as MenuItem[];
  };

  const visibleMenuItems = filterMenuItems(menuItems);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      setOpenDropdown(openDropdown === item.label ? null : item.label);
    } else if (item.path) {
      router.push(item.path);
      setOpenDropdown(null);
    }
  };

  const isItemActive = (item: MenuItem): boolean => {
    if (item.path) {
      return pathname === item.path;
    }
    if (item.children) {
      return item.children.some((child) => child.path === pathname);
    }
    return false;
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-8" ref={dropdownRef}>
          {visibleMenuItems.map((item) => {
            const isActive = isItemActive(item);
            const isOpen = openDropdown === item.label;

            return (
              <div key={item.label} className="relative">
                <button
                  onClick={() => handleItemClick(item)}
                  className={`px-4 py-4 font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                  {item.children && (
                    <svg
                      className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>

                {/* Dropdown Menu */}
                {item.children && isOpen && (
                  <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 min-w-[200px]">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.path;
                      return (
                        <button
                          key={child.path}
                          onClick={() => {
                            if (child.path) {
                              router.push(child.path);
                              setOpenDropdown(null);
                            }
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            isChildActive
                              ? "bg-blue-50 text-blue-600 font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
