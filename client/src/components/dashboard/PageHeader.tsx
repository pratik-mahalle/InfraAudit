import React, { ReactNode } from "react";
import { Toolbar } from "primereact/toolbar";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Toolbar className="mb-6 border-0 bg-transparent p-0" start={
      <div>
        <h1 className="text-2xl font-semibold font-inter mb-1">{title}</h1>
        {description && <p className="text-gray-500">{description}</p>}
      </div>
    } end={actions ? <div>{actions}</div> : undefined} />
  );
}
