"use client";

import { useContext, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { LoadingContext } from "@/context/Loading";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NotificationAlert } from "@/components/Alert";
import { useLanguage } from "@/context/Language";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { loading, setLoading } = useContext(LoadingContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorModal, setErrorModal] = useState({
    open: false,
    message: "",
  });

  useEffect(() => {
    setLoading(false);
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error");
    if (error) {
      setErrorModal({
        open: true,
        message: t("auth.login_failed"),
      });
    }
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSubmit = async (target: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.ok) {
        router.push(target);
      } else {
        setErrorModal({
          open: true,
          message: t("auth.check_credentials"),
        });
        setLoading(false);
      }
    } catch (err) {
      console.log(err);
      setErrorModal({
        open: true,
        message: t("auth.error_generic"),
      });
      setLoading(false);
    }
  };

  const handleSSOLogin = (target: string) => {
    setLoading(true);
    signIn("azure-ad", {
      callbackUrl: target,
      redirect: false,
    });
  };

  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-[url('/image/bg-login.webp')] bg-cover bg-center select-none">
      <div className=" w-full max-w-120 hidden md:block">
        <div className="relative z-10 bg-white/95 rounded-xl shadow-xl p-10">
          <div className="flex flex-row gap-6 items-center w-full mb-8">
            <Image
              src={"/image/logo-itb.png"}
              alt="logo"
              height={500}
              width={500}
              className="h-18 w-auto"
              draggable={false}
            />
            <div>
              <span className="font-medium text-2xl">
                Dashboard <br /> E-Facility Fleet
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                autoComplete="off"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A1FE] focus:border-transparent outline-none transition-all duration-200"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("auth.password")}
              </label>
              <div className="relative">
                <input
                  autoComplete="off"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A1FE] focus:border-transparent outline-none transition-all duration-200 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-center flex-col items-center w-full gap-6 mb-2">
              {/* Sign In Button */}
              <button
                onClick={() => handleSubmit("/admin/dashboard")}
                className="cursor-pointer mt-2 w-full bg-[#00A1FE] text-white py-3 rounded-lg font-medium hover:bg-[#037fc7] transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                {t("auth.login")}
              </button>

              {/* SSO Login Button */}
              <button
                onClick={() => handleSSOLogin("/admin/dashboard")}
                className="mx-auto flex gap-3 flex-row items-center justify-center cursor-pointer w-[80%] bg-[#171C34] text-white py-3 rounded-lg font-medium hover:bg-[#000000] transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Image
                  src={"/image/logo-ms.png"}
                  alt="logo"
                  height={500}
                  width={500}
                  className="h-5 w-auto"
                  draggable={false}
                />
                <span>{t("auth.sso")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className=" w-full min-h-full max-w-120 block md:hidden bg-white">
        <div className="bg-[url('/image/bg-login.webp')] bg-cover bg-center h-[35dvh] w-full"></div>
        <div className="px-6 py-5">
          <div className="flex flex-row gap-6 items-center w-full mb-6">
            <span className="font-bold text-xl">Welcome!</span>
          </div>

          <div className="space-y-6">
            <input
              placeholder="Email"
              autoComplete="off"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm md:text-base w-full px-4 py-3 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A1FE] focus:border-transparent outline-none transition-all duration-200"
            />

            {/* Password Field */}
            <div className="relative">
              <input
                placeholder="Password"
                autoComplete="off"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-sm md:text-base w-full px-4 py-3 border bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A1FE] focus:border-transparent outline-none transition-all duration-200 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex justify-center flex-col items-center w-full gap-5 mb-2">
              {/* Sign In Button */}
              <button
                onClick={() => handleSubmit("/inspector/home")}
                className="cursor-pointer text-sm md:text-base mt-2 w-full bg-[#00A1FE] text-white py-3 rounded-lg font-medium hover:bg-[#037fc7] transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                {t("auth.login")}
              </button>

              <div className="w-full h-[0.5px] bg-gray-300"></div>

              {/* SSO Login Button */}
              <button
                onClick={() => handleSSOLogin("/inspector/home")}
                className="mx-auto flex gap-3 flex-row items-center justify-center cursor-pointer text-sm md:text-base w-[80%] bg-[#171C34] text-white py-3 rounded-lg font-medium hover:bg-[#000000] transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Image
                  src={"/image/logo-ms.png"}
                  alt="logo"
                  height={500}
                  width={500}
                  className="h-4.5 w-auto"
                  draggable={false}
                />
                <span>{t("auth.sso")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <NotificationAlert
        visible={errorModal.open}
        title={t("auth.error_header")}
        subtitle={errorModal.message}
        type="error"
        onClose={() => {
          setErrorModal({ ...errorModal, open: false });
          setTimeout(() => setErrorModal({ open: false, message: "" }), 500);
        }}
      />
    </div>
  );
}
