import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo showTagline />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            SYNALYX Analytics is a school of data analytics and analysis. We train people to
            clean, question and present data so decisions stop being guesswork.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
            Explore
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/courses" className="text-muted-foreground hover:text-foreground">
                Courses
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-muted-foreground hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/enrol" className="text-muted-foreground hover:text-foreground">
                Enrol
              </Link>
            </li>
            <li>
              <Link to="/auth" className="text-muted-foreground hover:text-foreground">
                Student portal
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
            Contact
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>hello@synalyx.com</li>
            <li>+000 000 0000</li>
            <li>Add your campus address</li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} SYNALYX Analytics. Synchronized data, simplified
        decisions.
        <Link
          to="/auth"
          search={{ portal: "admin" }}
          aria-label="Staff access"
          title="Staff access"
          className="absolute bottom-3 right-4 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 transition-all duration-300 hover:scale-150 hover:bg-primary hover:shadow-[0_0_14px_2px_var(--color-primary)]"
        />
      </div>
    </footer>

  );
}
