import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@productstudio/auth";
import { instantiateComponent } from "@productstudio/component-registry";
import { createEmptyPageDocument } from "@productstudio/json-engine";
import { generateId } from "@productstudio/shared-types";
import type { ComponentNode, PageDocument, UserId } from "@productstudio/shared-types";

const prisma = new PrismaClient();

const SEED_EMAIL = "designer@productstudio.local";
const SEED_PASSWORD = "password123";

function node(type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []) {
  const base = instantiateComponent(type);
  const withProps: ComponentNode = { ...base, props: { ...base.props, ...props } };
  if (base.children) withProps.children = children;
  return withProps;
}

function templatePage(input: {
  name: string;
  slug: string;
  createdBy: UserId;
  children: ComponentNode[];
}): PageDocument {
  const doc = createEmptyPageDocument({
    pageId: generateId("pg"),
    projectId: generateId("prj"),
    name: input.name,
    slug: input.slug,
    createdBy: input.createdBy,
  });
  doc.root.children = input.children;
  return doc;
}

function landingPage(createdBy: UserId) {
  return templatePage({
    name: "Home",
    slug: "/",
    createdBy,
    children: [
      node("navigation.navbar", { brand: "Acme" }),
      node("marketing.hero", {
        heading: "Ship your next site in an afternoon",
        subheading: "A component-first builder your whole team can use.",
        ctaLabel: "Start free",
        ctaHref: "#pricing",
      }),
      node("layout.section", {}, [
        node("layout.container", {}, [
          node("basic.heading", { text: "Why teams choose us", level: 2, textAlign: "center" }),
          node("business.stats"),
        ]),
      ]),
      node("marketing.testimonial"),
      node("navigation.footer", { copyright: "© 2026 Acme Inc." }),
    ],
  });
}

function aboutPage(createdBy: UserId) {
  return templatePage({
    name: "About",
    slug: "/about",
    createdBy,
    children: [
      node("navigation.navbar", { brand: "Acme" }),
      node("layout.section", {}, [
        node("layout.container", {}, [
          node("basic.heading", { text: "About us", level: 1 }),
          node("basic.text", {
            text: "We build tools that help product teams launch marketing pages without waiting on an engineering sprint.",
          }),
        ]),
      ]),
      node("navigation.footer"),
    ],
  });
}

function portfolioPage(createdBy: UserId) {
  return templatePage({
    name: "Home",
    slug: "/",
    createdBy,
    children: [
      node("layout.section", {}, [
        node("layout.container", {}, [
          node("basic.heading", { text: "Jordan Rivera", level: 1, textAlign: "center" }),
          node("basic.text", {
            text: "Product designer focused on design systems and developer tooling.",
            textAlign: "center",
          }),
          node("layout.spacer"),
          node("layout.grid", {}, [
            node("basic.image"),
            node("basic.image"),
            node("basic.image"),
          ]),
        ]),
      ]),
      node("navigation.footer", { copyright: "© 2026 Jordan Rivera" }),
    ],
  });
}

function contactPage(createdBy: UserId) {
  return templatePage({
    name: "Contact",
    slug: "/contact",
    createdBy,
    children: [
      node("navigation.navbar", { brand: "Acme" }),
      node("layout.section", {}, [
        node("layout.container", {}, [
          node("basic.heading", { text: "Get in touch", level: 1, textAlign: "center" }),
          node("forms.container", {}, [node("forms.submit")]),
        ]),
      ]),
      node("navigation.footer"),
    ],
  });
}

const STARTER_TEMPLATES = [
  {
    name: "SaaS Landing",
    category: "marketing",
    description: "Hero, stats and testimonial sections for a product launch page.",
    pages: (userId: UserId) => [
      { doc: landingPage(userId), isHome: true },
      { doc: aboutPage(userId), isHome: false },
    ],
  },
  {
    name: "Portfolio",
    category: "personal",
    description: "A single-page portfolio with an image grid.",
    pages: (userId: UserId) => [{ doc: portfolioPage(userId), isHome: true }],
  },
  {
    name: "Contact Page",
    category: "business",
    description: "A minimal contact page with a submission form.",
    pages: (userId: UserId) => [{ doc: contactPage(userId), isHome: true }],
  },
];

async function seedUser() {
  const existing = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
  if (existing) {
    console.log("Seed user already exists:", SEED_EMAIL);
    return existing;
  }

  const user = await prisma.user.create({
    data: {
      id: generateId("usr"),
      email: SEED_EMAIL,
      passwordHash: await hashPassword(SEED_PASSWORD),
      role: "DESIGNER",
    },
  });
  console.log("Created seed user:", user.email, `password: ${SEED_PASSWORD}`);
  return user;
}

async function seedTemplates(userId: UserId) {
  for (const starter of STARTER_TEMPLATES) {
    const existing = await prisma.template.findFirst({ where: { name: starter.name } });
    if (existing) {
      console.log("Template already exists:", starter.name);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const template = await tx.template.create({
        data: {
          id: generateId("tpl"),
          name: starter.name,
          category: starter.category,
          description: starter.description,
        },
      });

      const version = await tx.templateVersion.create({
        data: {
          id: generateId("tvr"),
          templateId: template.id,
          versionNumber: 1,
        },
      });

      const pages = starter.pages(userId);
      for (const [index, page] of pages.entries()) {
        await tx.templatePage.create({
          data: {
            id: generateId("tpg"),
            templateVersionId: version.id,
            name: page.doc.name,
            slug: page.doc.slug,
            isHome: page.isHome,
            sortOrder: index,
            contentJson: page.doc as unknown as object,
          },
        });
      }
    });

    console.log("Created template:", starter.name);
  }
}

async function main() {
  const user = await seedUser();
  await seedTemplates(user.id as UserId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
