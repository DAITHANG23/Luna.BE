import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel";
import jwt from "jsonwebtoken";

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
            email: profile.emails?.[0]?.value || "",
            avatarUrl: profile.photos?.[0]?.value || "",
          });
        }

        const newAccessToken = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET!,
          {
            expiresIn: "1h",
          }
        );

        const newRefreshToken = jwt.sign(
          { userId: user._id },
          process.env.REFRESH_SECRET!,
          {
            expiresIn: "30d",
          }
        );

        user.refreshToken = newRefreshToken;
        await user.save();

        const authData: any = {
          user,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        };

        return done(null, authData);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
