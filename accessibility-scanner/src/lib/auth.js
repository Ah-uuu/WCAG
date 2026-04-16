const { betterAuth } = require('better-auth');
const { prismaAdapter } = require('better-auth/adapters/prisma');
const { prisma } = require('./db');

const auth = betterAuth({
        database: prismaAdapter(prisma, {
                    provider: 'postgresql',
        }),
        baseURL: process.env.BETTER_AUTH_URL,
        secret: process.env.BETTER_AUTH_SECRET,
        emailAndPassword: {
                    enabled: true,
                    requireEmailVerification: false,
                    minPasswordLength: 8,
        },
        socialProviders: {
                    google: {
                                    clientId: process.env.GOOGLE_CLIENT_ID || '',
                                    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                    },
        },
        session: {
                    expiresIn: 60 * 60 * 24 * 7,
                    updateAge: 60 * 60 * 24,
                    cookieCache: {
                                    enabled: true,
                                    maxAge: 5 * 60,
                    },
        },
        trustedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
        advanced: {
                    defaultCookieAttributes: {
                                    sameSite: 'none',
                                    secure: true,
                    },
        },
});

module.exports = { auth };
