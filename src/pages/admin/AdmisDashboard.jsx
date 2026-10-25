
import {
  FiSearch,
  FiBell,
  FiChevronRight,
  FiUsers,
  FiAward,
  FiTarget,
  FiBookOpen,
} from "react-icons/fi";

import AdminSidebar from "./SideBar";
import { useEffect, useState } from "react";
import { adminDashboard } from "../../services.jsx/adminApi";

export default function AdminDashboardBoard() {


  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState("");

  const [pendingChallenges] = useState([]);
  const [activeChallenges] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setDashboardError("");

        const result = await adminDashboard();

        console.log("Dashboard API result:", result);

        if (isMounted) {
          if (result) {
            setDashboardData(result);
          } else {
            setDashboardError("Dashboard data was not returned.");
          }
        }
      } catch (error) {
        console.error(
          "Dashboard fetch failed:",
          error.response?.data || error.message
        );

        if (isMounted) {
          setDashboardError("Unable to load dashboard data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const analytics = [
    {
      title: "Total Challenges",
      value: dashboardData?.totalChallenges ?? 0,
      icon: FiTarget,
    },
    {
      title: "Quiz Results",
      value: dashboardData?.totalQuizResults ?? 0,
      icon: FiAward,
    },
    {
      title: "Total Students",
      value: dashboardData?.totalStudents ?? 0,
      icon: FiUsers,
    },
  ];

  const filteredChallenges = activeChallenges.filter((challenge) =>
    `${challenge.title ?? ""} ${challenge.category ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#e7faf5]">
      <AdminSidebar activePage="Overview" />

      <div className="ml-[250px] min-h-screen min-w-0">
        <div className="min-h-screen w-full bg-white px-5 py-5 sm:px-7 sm:py-6 lg:px-9 lg:py-7">
          {/* Header */}
          <header className="flex w-full flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="relative w-full max-w-[350px]">
              <FiSearch
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search challenges or topics..."
                className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex shrink-0 items-center gap-4 text-[#104b3b]">
              <button
                type="button"
                aria-label="Notifications"
                className="relative rounded-full p-2 hover:bg-emerald-50"
              >
                <FiBell size={20} />
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9f4e9] font-semibold text-[#104b3b]">
                A
              </div>
            </div>
          </header>

          <main className="w-full min-w-0 pt-6">
            {/* Welcome */}
            <section className="mb-8 flex flex-wrap items-center justify-between gap-5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-700">
                  EcoQuest / Admin
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#104b3b] sm:text-3xl">
                  Welcome back, Admin!
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Manage environmental learning, student challenges and
                  submissions from one place.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#087f5b] px-4 py-3 text-sm font-semibold text-white hover:bg-[#066b4d]"
              >
                Manage challenges <FiChevronRight size={17} />
              </button>
            </section>

            {dashboardError && (
              <p
                role="alert"
                className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {dashboardError}
              </p>
            )}

            {/* Pending submissions */}
            <section className="grid w-full min-w-0 grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.9fr)]">
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-[#104b3b]">
                      Pending submissions
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      {loading
                        ? "Loading submissions..."
                        : `${
                            dashboardData?.pendingSubmissions ?? 0
                          } submissions awaiting review`}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 text-xs font-semibold text-[#087f5b] hover:underline"
                  >
                    View all <FiChevronRight className="inline" />
                  </button>
                </div>

                {loading ? (
                  <p className="rounded-xl bg-gray-50 p-6 text-sm text-gray-500">
                    Loading submissions...
                  </p>
                ) : pendingChallenges.length > 0 ? (
                  <div className="space-y-3">
                    {pendingChallenges.map((item) => (
                      <article
                        key={item._id}
                        className="flex min-w-0 items-center gap-3 rounded-xl bg-[#f5f7f6] p-3 sm:gap-4 sm:px-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                          {(item.studentName ?? "Student")
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#164e40]">
                            {item.studentName ?? "Student"}
                          </p>
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {item.challengeTitle ?? "Challenge submission"}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-semibold text-orange-700">
                          {item.status ?? "Pending"}
                        </span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-gray-50 p-6 text-sm text-gray-500">
                    No submission records loaded.
                  </p>
                )}
              </div>

              {/* Updates */}
              <div className="min-w-0">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-[#104b3b]">
                    EcoQuest updates
                  </h2>
                  <FiBookOpen size={18} className="text-[#104b3b]" />
                </div>

                <div className="flex min-h-[210px] flex-col items-start rounded-2xl bg-[#e5f8f2] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#087f5b]">
                    <FiBookOpen size={23} />
                  </div>

                  <h3 className="mt-4 font-bold text-[#104b3b]">
                    EcoQuest
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Environmental learning dashboard.
                  </p>
                </div>
              </div>
            </section>

            {/* Active challenges + analytics */}
            <section className="mt-9 grid w-full min-w-0 grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.9fr)]">
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-bold text-[#104b3b]">
                    Active challenges
                  </h2>
                </div>

                {loading ? (
                  <p className="rounded-xl bg-gray-50 p-6 text-sm text-gray-500">
                    Loading challenges...
                  </p>
                ) : filteredChallenges.length > 0 ? (
                  <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                    {filteredChallenges.map((challenge) => (
                      <article
                        key={challenge._id}
                        className="flex min-w-0 flex-col rounded-2xl bg-[#e5f8f2] p-5"
                      >
                        <p className="text-xs font-medium text-gray-600">
                          {challenge.category ?? ""}
                        </p>

                        <h3 className="mt-2 break-words text-lg font-bold text-[#104b3b]">
                          {challenge.title}
                        </h3>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-gray-50 p-6 text-sm text-gray-500">
                    No challenge records loaded.
                  </p>
                )}
              </div>

              {/* Analytics from API */}
              <div className="min-w-0">
                <div className="mb-4">
                  <h2 className="font-bold text-[#104b3b]">Analytics</h2>
                </div>

                <div className="space-y-3">
                  {analytics.map((item) => {
                    const Icon = item.icon;

                    return (
                      <article
                        key={item.title}
                        className="flex min-w-0 items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.04)]"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f8f2] text-[#104b3b]">
                          <Icon size={24} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">
                            {item.title}
                          </p>

                          <p className="mt-1 text-2xl font-bold text-[#104b3b]">
                            {loading ? "..." : item.value}
                          </p>
                        </div>

                        <FiChevronRight
                          size={21}
                          className="shrink-0 text-[#104b3b]"
                        />
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          </main>

          <footer className="mt-8 border-t border-gray-100 pt-5 text-xs text-gray-400">
            EcoQuest · Learn today, protect tomorrow.
          </footer>
        </div>
      </div>
    </div>
  );
}
