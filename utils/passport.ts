import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import redis from "./redis";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            fullName: profile.displayName,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            email: profile.emails?.[0]?.value || "",
            avatarUrl: profile.photos?.[0]?.value || "",
          });
        }

        const newAccessToken = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET!,
          {
            expiresIn: "7d",
          }
        );
        const sessionId = crypto.randomBytes(16).toString("hex");

        const ttlSeconds = 60 * 60 * 24 * 7;
        await redis.set(
          `session:${sessionId}`,
          newAccessToken,
          "EX",
          ttlSeconds
        );

        const authData: any = {
          user,
          sessionId: sessionId,
        };

        return done(null, authData);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
