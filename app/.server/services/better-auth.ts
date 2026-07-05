import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";
import { connectToDB } from "../config/database";
import { env } from "../config/keys";
import Cohort from "../model/cohort";
import MongooseUser from "../model/user";
import { workflowClient } from "../workflows/client";

const getOrigin = (url?: string) => {
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
};

const createAuth = (db: any, client: any) =>
  betterAuth({
    appName: "Tsa-Interns",
    database: mongodbAdapter(db, {
      client,
      transaction: false,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async (user: any) => {
            if (["admin", "super_admin"].includes(user.role)) {
              const db = mongoose.connection.db as any;
              await db
                .collection("user")
                .updateOne(
                  { _id: new mongoose.Types.ObjectId(user.id) },
                  { $set: { emailVerified: true } },
                );
            }
          },
        },
      },
    },
    trustedOrigins: [getOrigin(env.clientUrl)].filter(Boolean) as string[],
    baseURL: env.betterAuthUrl,
    session: {
      maxAge: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 0,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Hardened for production
      sendResetPassword: async ({
        user,
        url,
      }: {
        user: any;
        url: string;
      }) => {
        await workflowClient.trigger({
          url: `${env.clientUrl}/api/v1/workflow/password-reset`,
          body: { user: user as User, link: url },
        });
      },
      onPasswordReset: async ({ user }: { user: any }) => {
        await MongooseUser.updateOne(
          { email: user.email },
          { $set: { isSuspended: false, failedLoginAttempts: 0 } },
        );
        await workflowClient.trigger({
          url: `${env.clientUrl}/api/v1/workflow/password-reset-success`,
          body: { user: user as User },
        });
      },
      resetPasswordTokenExpiresIn: 60 * 15, // 15 minutes
      asResponse: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      asResponse: true,
      callbackURL: `${env.clientUrl}/account/verify-email`,
      emailVerificationTokenExpiresIn: 60 * 15, // 15 minutes
      sendVerificationEmail: async ({
        user,
        url,
      }: {
        user: any;
        url: string;
      }) => {
        user.role === "user" &&
          (await workflowClient.trigger({
            url: `${env.clientUrl}/api/v1/workflow/verify-account`,
            body: { user: user as User, link: url },
          }));
      },
    },
    user: {
      changeEmail: {
        enabled: true,
      },
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          const userId = new mongoose.Types.ObjectId(user.id);
          await Cohort.updateMany(
            { members: userId },
            { $pull: { members: userId } },
          );
        },
        sendDeleteAccountVerification: async ({ user, url }) => {
          await workflowClient.trigger({
            url: `${env.clientUrl}/api/v1/workflow/delete-account-request`,
            body: { user: user as User, link: url },
          });
        },
      },
      additionalFields: {
        role: {
          type: "string",
          input: true,
          enum: ["user", "admin", "super_admin"],
          defaultValue: "user",
        },
        isOnboarded: {
          type: "boolean",
          defaultValue: false,
        },
        gender: {
          type: "string",
          enum: ["male", "female", "other"],
          required: false,
        },
        phone: {
          type: "string",
          required: false,
        },
        imagePublicId: {
          type: "string",
          required: false,
        },
        cohort: {
          type: "string",
          required: false,
        },
        program: {
          type: "string",
          enum: [
            "full-stack",
            "product-design",
            "data-analysis",
            "cyber-security",
          ],
          required: false,
        },
      },
    },
    advanced: {
      cookiePrefix: "__tsaintern",
      crossSubDomainCookies: {
        enabled: false,
      },
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.nodeEnv === "production",
        httpOnly: true,
      },
    },
  });

type AuthInstance = ReturnType<typeof createAuth>;
let authInstance: AuthInstance | null = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;
  await connectToDB();
  authInstance = createAuth(
    mongoose.connection.db,
    mongoose.connection.getClient(),
  );
  return authInstance;
};

export const auth = await getAuth();
if (!auth) throw new Error("Failed to initialize auth");
export type Session = typeof auth.$Infer.Session;

export type User = typeof auth.$Infer.Session.user;
