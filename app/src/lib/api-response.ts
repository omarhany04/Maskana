import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Validation failed",
        issues: error.flatten(),
      },
      { status: 422 },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "A record with these values already exists." },
        { status: 409 },
      );
    }
  }

  console.error(error);

  return NextResponse.json(
    {
      message: "Internal server error",
    },
    { status: 500 },
  );
}

export function jsonSuccess<T>(payload: T, status = 200) {
  return NextResponse.json(payload, { status });
}

