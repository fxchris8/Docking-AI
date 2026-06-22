"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function SideBar() {
  const currentPath = usePathname();
  const { user, logout, loading } = useAuth();

  // Hindari hydration mismatch: jangan render apa pun sampai client siap
  if (loading) return null;

  const sides = [
    {
      id: 1,
      menu: "Dashboard",
      path: "/dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M128,24a8,8,0,0,0-8,8V88a8,8,0,0,0,8,8,32,32,0,1,1-27.72,16,8,8,0,0,0-2.93-10.93l-48.5-28A8,8,0,0,0,37.92,76,104,104,0,1,0,128,24ZM48.09,91.1,83,111.26A48.09,48.09,0,0,0,80,128c0,1.53.08,3,.22,4.52L41.28,143A88.16,88.16,0,0,1,48.09,91.1Zm-2.67,67.31,39-10.44A48.1,48.1,0,0,0,120,175.32v40.31A88.2,88.2,0,0,1,45.42,158.41ZM136,215.63V175.32a48,48,0,0,0,0-94.65V40.36a88,88,0,0,1,0,175.27Z"></path>
        </svg>
      ),
    },
    {
      id: 2,
      menu: "Ongoing Docking",
      path: "/ongoing",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M213.66,66.34l-40-40A8,8,0,0,0,168,24H88A16,16,0,0,0,72,40V56H56A16,16,0,0,0,40,72V216a16,16,0,0,0,16,16H168a16,16,0,0,0,16-16V200h16a16,16,0,0,0,16-16V72A8,8,0,0,0,213.66,66.34ZM168,216H56V72h76.69L168,107.31v84.53c0,.06,0,.11,0,.16s0,.1,0,.16V216Zm32-32H184V104a8,8,0,0,0-2.34-5.66l-40-40A8,8,0,0,0,136,56H88V40h76.69L200,75.31Zm-56-32a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h48A8,8,0,0,1,144,152Zm0,32a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h48A8,8,0,0,1,144,184Z"></path>
        </svg>
      ),
    },
    {
      id: 3,
      menu: "Docking History",
      path: "/list",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M224,48H32A16,16,0,0,0,16,64V88a16,16,0,0,0,16,16v88a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V104a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM208,192H48V104H208ZM224,88H32V64H224V88ZM96,136a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,136Z"></path>
        </svg>
      ),
    },
    {
      id: 4,
      menu: "Database",
      path: "/database",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          viewBox="0 0 256 256"
        >
          <path d="M128,24C74.17,24,32,48.6,32,80v96c0,31.4,42.17,56,96,56s96-24.6,96-56V80C224,48.6,181.83,24,128,24Zm80,104c0,9.62-7.88,19.43-21.61,26.92C170.93,163.35,150.19,168,128,168s-42.93-4.65-58.39-13.08C55.88,147.43,48,137.62,48,128V111.36c17.06,15,46.23,24.64,80,24.64s62.94-9.68,80-24.64ZM69.61,53.08C85.07,44.65,105.81,40,128,40s42.93,4.65,58.39,13.08C200.12,60.57,208,70.38,208,80s-7.88,19.43-21.61,26.92C170.93,115.35,150.19,120,128,120s-42.93-4.65-58.39-13.08C55.88,99.43,48,89.62,48,80S55.88,60.57,69.61,53.08ZM186.39,202.92C170.93,211.35,150.19,216,128,216s-42.93-4.65-58.39-13.08C55.88,195.43,48,185.62,48,176V159.36c17.06,15,46.23,24.64,80,24.64s62.94-9.68,80-24.64V176C208,185.62,200.12,195.43,186.39,202.92Z"></path>
        </svg>
      ),
    },
    {
      id: 5,
      menu: "Cek Nota",
      path: "/checker",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6"
        >
          <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
    },
  ];

  // Filter menu berdasarkan role
  const visibleSides =
    user?.role === "admin"
      ? sides
      : sides.filter(
          (item) => item.path === "/list" || item.path === "/checker",
        );

  // Inisial untuk avatar (2 huruf pertama nama)
  const initials = user?.nama
    ? user.nama
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user?.username?.substring(0, 2).toUpperCase() || "??";

  return (
    <div className="w-[280px] min-h-screen flex flex-col justify-between text-white bg-[#130b24] border-r border-[#2e004f]/50">
      <div className="top-section px-6 py-10">
        <div className="flex w-full justify-center mb-8">
          <Link href="/dashboard" className="w-[70%] flex">
            <Image
              src="/Logo.png"
              width={100}
              height={100}
              alt="Logo SPIL"
              className="w-full"
              loading="eager"
            ></Image>
          </Link>
        </div>
        <div className="header flex flex-col mb-12 gap-1 relative">
          <div className="absolute -inset-4 bg-[#2e004f] blur-2xl opacity-20 -z-10 rounded-full"></div>
          <h1 className="text-[28px] font-bold text-white tracking-wide">
            Log Book
          </h1>
          <p className="text-sm font-medium text-gray-400 leading-tight">
            PT Salam Pasific Indonesia
            <br />
            Lines
          </p>
        </div>

        <div className="main flex flex-col gap-2">
          {visibleSides.map((item) => {
            const isActive = currentPath.includes(item.path);

            return (
              <Link
                href={item.path}
                key={item.id}
                className={`group flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ease-in-out duration-200 relative overflow-hidden ${
                  isActive
                    ? "bg-[#6f16ae] text-white shadow-[0_4px_20px_rgba(46,0,79,0.5)] backdrop-blur-md border border-[#2e004f]"
                    : "bg-transparent text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <div
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-gray-500 group-hover:text-white"
                  }`}
                >
                  {item.icon}
                </div>
                <h1
                  className={`text-[15px] ${
                    isActive ? "font-bold tracking-wide" : "font-medium"
                  }`}
                >
                  {item.menu}
                </h1>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bagian bawah: info user + logout */}
      {user && (
        <div className="px-6 pb-6 flex flex-col gap-3">
          {/* Info pengguna */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">
                {user.nama}
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {user.role}
              </span>
            </div>
          </div>

          {/* Tombol Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M112,216a8,8,0,0,1-8,8H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h56a8,8,0,0,1,0,16H48V208h56A8,8,0,0,1,112,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L196.69,120H104a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,221.66,122.34Z"></path>
            </svg>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
