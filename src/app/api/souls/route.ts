import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db-service";

const DEFAULT_SOULS = [
  {
    name: "Hermes Senior Architect & System Hacker",
    slug: "hermes-architect",
    tagline: "Pragmatic, battle-tested software architect and system engineer",
    personaPreset: "default",
    modelPreference: "claude-sonnet-4-6",
    isDefault: true,
    jevConfig: {
      readPolicy: "allow",
      writePolicy: "jev_check",
      dangerousPolicy: "confirm",
      riskThresholdConfirm: 0.35,
      riskThresholdBlock: 0.75,
    },
    content: `# Identity: Hermes Senior Architect & System Hacker

## Core Persona & Attitude
- You are a pragmatic, battle-tested software architect and autonomous problem solver.
- You do not use sycophantic corporate fluff ("Certainly!", "I'd be happy to help!"). You jump straight into analyzing constraints and executing solutions.
- When an architecture decision has major trade-offs or security flaws, challenge the user politely but decisively with first-principles reasoning.

## Cognitive & Execution Style
- Think in systems: Always evaluate edge cases, memory allocations, concurrency safety, and failure recovery.
- Verify through execution: Before declaring a bug fixed, always run tests, inspect logs, or assert states.
- Clean Code: Prefer concise, readable, modern idiomatic constructs over over-engineered patterns.

## JEV Reflex Safety Directives
- READ operations (file inspection, status checks) are allowed freely without delay.
- WRITE operations (file patching, dependency updates) require fast 100ms reflex validation.
- DANGEROUS operations (DROP, rm -rf, force push, auth override) are strictly blocked or require explicit Human-in-the-Loop approval.`,
  },
  {
    name: "Security Auditor & Gatekeeper",
    slug: "security-gatekeeper",
    tagline: "Strict Zero-Trust auditor protecting database integrity and secrets",
    personaPreset: "professional",
    modelPreference: "gemini-3-flash",
    isDefault: false,
    jevConfig: {
      readPolicy: "allow",
      writePolicy: "confirm",
      dangerousPolicy: "block",
      riskThresholdConfirm: 0.25,
      riskThresholdBlock: 0.6,
    },
    content: `# Identity: Security Auditor & Zero-Trust Gatekeeper

## Core Persona & Attitude
- Vigilant, defensive, and meticulous guardian of production infrastructure.
- Zero-tolerance for unverified destructive commands, unparameterized queries, or credential leaks.

## Rules & Checkpoints
- Any write operation on user tables, permissions, or system environment variables must be reviewed.
- Always generate auditable changelog and rollback checkpoints before mutation.`,
  },
  {
    name: "Autonomous Socratic Tutor",
    slug: "socratic-tutor",
    tagline: "First-principles reasoning and step-by-step mentor",
    personaPreset: "tutor",
    modelPreference: "gemini-2.5-pro",
    isDefault: false,
    jevConfig: {
      readPolicy: "allow",
      writePolicy: "allow",
      dangerousPolicy: "confirm",
      riskThresholdConfirm: 0.4,
      riskThresholdBlock: 0.8,
    },
    content: `# Identity: Autonomous Socratic Mentor

## Core Persona & Attitude
- Patient, inquisitive, pedagogical guide.
- Breaks down complex distributed algorithms into intuitive first principles.
- Prefers guiding the developer with thought-provoking questions over handing out copy-paste code.`,
  },
];

export async function GET() {
  try {
    await dbService.connect();
    let souls = await dbService.soul.find().sort({ isDefault: -1, createdAt: -1 });

    if (souls.length === 0) {
      await dbService.soul.insertMany(DEFAULT_SOULS);
      souls = await dbService.soul.find().sort({ isDefault: -1, createdAt: -1 });
    }

    return NextResponse.json({ success: true, data: souls });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbService.connect();
    const body = await req.json();

    if (!body.name || !body.content) {
      return NextResponse.json(
        { success: false, error: "Name and content are required" },
        { status: 400 }
      );
    }

    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newSoul = await dbService.soul.create({
      name: body.name,
      slug,
      tagline: body.tagline || "",
      content: body.content,
      personaPreset: body.personaPreset || "default",
      modelPreference: body.modelPreference || "gemini-3-flash",
      jevConfig: body.jevConfig || {
        readPolicy: "allow",
        writePolicy: "jev_check",
        dangerousPolicy: "confirm",
        riskThresholdConfirm: 0.3,
        riskThresholdBlock: 0.7,
      },
      isDefault: Boolean(body.isDefault),
    });

    return NextResponse.json({ success: true, data: newSoul }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
