/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaPalette, FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useForm } from "react-hook-form";
// import { BACKEND_URL } from "@/lib/env";
import { AUTH_SERVICE_URL } from "@/lib/env";
import { useUser } from "../context/user-context";

type FormValues = {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
};

const AuthPage = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchCurrentUser, setUser } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    console.log("🚀 onSubmit triggered with values:", values);
    setError(null);

    try {
      const url = isLogin
        // ? `${BACKEND_URL}/auth/login`
        // : `${BACKEND_URL}/auth/signup`;
        ? `${AUTH_SERVICE_URL}/auth/login`
        : `${AUTH_SERVICE_URL}/auth/signup`;

      console.log("🔍 DEBUG: Submitting form with:", values);

      console.log("🌍 Fetching URL:", url);
      console.log("📦 Payload:", {
        email: values.email,
        password: values.password,
        ...(isLogin
          ? {}
          : { firstName: values.firstName, lastName: values.lastName }),
      });

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          ...(isLogin
            ? {}
            : { firstName: values.firstName, lastName: values.lastName }),
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          console.warn("Response not JSON");
        }
        throw new Error(errorData.message || "Authentication failed");
      }

      const data = await response.json();

      const accessToken = data.access_token || data.token || data.accessToken;
      if (accessToken) {
        localStorage.setItem("token", accessToken);
      }

      if (data.user) {
        setUser(data.user);
      }

      await fetchCurrentUser();
      router.push("/general-dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/landing" className="flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg mx-auto cursor-pointer">
              <FaPalette className="text-white text-xl" />
            </div>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-800 dark:text-white">
            {isLogin ? "Login to your account" : "Create a new account"}
          </h2>
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-200 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {!isLogin && (
              <>
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-3 text-gray-400" />
                    <input
                      {...register("firstName", {
                        required: !isLogin ? "First name is required" : false,
                      })}
                      className="block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-3 text-gray-400" />
                    <input
                      {...register("lastName", {
                        required: !isLogin ? "Last name is required" : false,
                      })}
                      className="block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email",
                    },
                  })}
                  className="block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className="block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700"
              >
                {isSubmitting ? "Processing..." : isLogin ? "Login" : "Sign Up"}
              </button>
            </div>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
