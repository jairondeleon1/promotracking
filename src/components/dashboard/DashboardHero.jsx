import React from "react";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export default function DashboardHero({ user, summary }) {
  const firstName = (user?.full_name || "").split(" ")[0];
  return (
    <section className="bg-hero text-hero-foreground">
      <div className="mx-auto max-w-screen-xl px-4 pb-6 pt-6 sm:px-6">
        <p className="text-sm font-semibold text-highlight">
          {greeting()}{firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Promotion Performance</h1>
        <p className="mt-2 text-sm text-hero-muted">{summary}</p>
      </div>
    </section>
  );
}