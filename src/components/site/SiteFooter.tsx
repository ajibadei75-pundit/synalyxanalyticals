import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, MessageCircle, Twitter, Youtube } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const socialLinks = [
  { key: "instagram_url", label: "Instagram", Icon: Instagram },
  { key: "facebook_url", label: "Facebook", Icon: Facebook },
  { key: "linkedin_url", label: "LinkedIn", Icon: Linkedin },
  { key: "youtube_url", label: "YouTube", Icon: Youtube },
  { key: "x_url", label: "X", Icon: Twitter },
  { key: "whatsapp_url", label: "WhatsApp", Icon: MessageCircle },
] as const;

export function SiteFooter() {
  const { data: settings } = useSiteSettings();
  const activeSocialLinks = socialLinks.filter((social) => settings?.[social.key]);

  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo showTagline />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Synalyx Analyticals is a school of data analytics and analysis. We train people to
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
              <Link to="/projects" className="text-muted-foreground hover:text-foreground">
                Projects
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="text-muted-foreground hover:text-foreground">
                Gallery
              </Link>
            </li>
            <li>
              <Link to="/merch" className="text-muted-foreground hover:text-foreground">
                Merch
              </Link>
            </li>
            <li>
              <Link to="/blog" className="text-muted-foreground hover:text-foreground">
                Blog
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
          {activeSocialLinks.length > 0 && (
            <div className="mt-7">
              <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                Follow the signal
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {activeSocialLinks.map(({ key, label, Icon }) => {
                  const href = settings?.[key];
                  if (!href) return null;
                  return (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Synalyx Analyticals on ${label}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
            Contact
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>hello@synalyx.com</li>
            <li>
              <a href="tel:+2349153462245" className="hover:text-foreground">
                09153462245
              </a>
            </li>
            <li>Add your campus address</li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Synalyx Analyticals. Synchronized data, simplified
        decisions.
        {/* Unlabelled, invisible staff entry point — intentionally not discoverable by visitors. */}
        <Link
          to="/auth"
          search={{ portal: "admin" }}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute bottom-2 right-2 h-4 w-4 rounded-full opacity-0"
        />

      </div>
    </footer>
  );
}
