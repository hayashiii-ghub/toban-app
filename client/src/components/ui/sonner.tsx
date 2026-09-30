import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      // スマホのホームでは下に操作の帯があるので、その上に出す（home.css の --home-toolbar-space）
      offset={{ bottom: "calc(24px + var(--home-toolbar-space, 0px))" }}
      mobileOffset={{
        bottom:
          "calc(16px + var(--home-toolbar-space, 0px) + env(safe-area-inset-bottom, 0px))",
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
