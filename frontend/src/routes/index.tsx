import { lazy, Suspense } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { BlankLayout } from "@/layouts/BlankLayout";
import { FullScreenLoader } from "@/components/common/FullScreenLoader";
import { ROUTES } from "@/config/routes.config";

// Lazy-loaded page components
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const EmailSent = lazy(() => import("@/pages/EmailSent"));
const AccountPending = lazy(() => import("@/pages/AccountPending"));
const SessionExpired = lazy(() => import("@/pages/SessionExpired"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Courses = lazy(() => import("@/pages/Courses"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Profile = lazy(() => import("@/pages/Profile"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Terms = lazy(() => import("@/pages/Terms"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const CookiePolicy = lazy(() => import("@/pages/CookiePolicy"));
const NotFound = lazy(() => import("@/components/ui/NotFound").then(module => ({ default: module.NotFound })));
const Checkout = lazy(() => import("@/pages/Checkout"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const PaymentFailure = lazy(() => import("@/pages/PaymentFailure"));
const CoursePlayer = lazy(() => import("@/pages/CoursePlayer"));

// Reusable Suspense wrapper (Route Loader)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Loadable = (Component: React.ComponentType<any>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LoadableComponent = (props: any) => (
    <Suspense fallback={<FullScreenLoader />}>
      <Component {...props} />
    </Suspense>
  );
  LoadableComponent.displayName = `Loadable(${Component.displayName || Component.name || "Component"})`;
  return LoadableComponent;
};

const HomeLoadable = Loadable(Home);
const LoginLoadable = Loadable(Login);
const RegisterLoadable = Loadable(Register);
const ForgotPasswordLoadable = Loadable(ForgotPassword);
const ResetPasswordLoadable = Loadable(ResetPassword);
const VerifyEmailLoadable = Loadable(VerifyEmail);
const EmailSentLoadable = Loadable(EmailSent);
const AccountPendingLoadable = Loadable(AccountPending);
const SessionExpiredLoadable = Loadable(SessionExpired);
const UnauthorizedLoadable = Loadable(Unauthorized);
const DashboardLoadable = Loadable(Dashboard);
const CoursesLoadable = Loadable(Courses);
const CourseDetailLoadable = Loadable(CourseDetail);
const PricingLoadable = Loadable(Pricing);
const ProfileLoadable = Loadable(Profile);
const AboutLoadable = Loadable(About);
const ContactLoadable = Loadable(Contact);
const FAQLoadable = Loadable(FAQ);
const PrivacyPolicyLoadable = Loadable(PrivacyPolicy);
const TermsLoadable = Loadable(Terms);
const RefundPolicyLoadable = Loadable(RefundPolicy);
const CookiePolicyLoadable = Loadable(CookiePolicy);
const NotFoundLoadable = Loadable(NotFound);
const CheckoutLoadable = Loadable(Checkout);
const PaymentSuccessLoadable = Loadable(PaymentSuccess);
const PaymentFailureLoadable = Loadable(PaymentFailure);
const CoursePlayerLoadable = Loadable(CoursePlayer);

export function AppRoutes() {
  const routes = useRoutes([
    // Public routes (uses PublicLayout)
    {
      path: ROUTES.home,
      element: <PublicLayout />,
      children: [
        { index: true, element: <HomeLoadable /> },
        { path: ROUTES.about, element: <AboutLoadable /> },
        { path: ROUTES.contact, element: <ContactLoadable /> },
        { path: ROUTES.courses, element: <CoursesLoadable /> },
        { path: ROUTES.courseDetail, element: <CourseDetailLoadable /> },
        { path: ROUTES.pricing, element: <PricingLoadable /> },
        { path: ROUTES.faq, element: <FAQLoadable /> },
        { path: ROUTES.privacy, element: <PrivacyPolicyLoadable /> },
        { path: ROUTES.terms, element: <TermsLoadable /> },
        { path: ROUTES.refund, element: <RefundPolicyLoadable /> },
        { path: ROUTES.cookie, element: <CookiePolicyLoadable /> },
      ],
    },
    // Portal/Internal routes (uses DashboardLayout)
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        { path: ROUTES.dashboard, element: <DashboardLoadable /> },
        { path: "/student", element: <DashboardLoadable /> },
        { path: "/instructor", element: <DashboardLoadable /> },
        { path: "/mentor", element: <DashboardLoadable /> },
        { path: "/admin", element: <DashboardLoadable /> },
        { path: ROUTES.courses, element: <CoursesLoadable /> },
        { path: ROUTES.profile, element: <ProfileLoadable /> },
      ],
    },
    // Authentication routes (uses BlankLayout)
    {
      path: "/",
      element: <BlankLayout />,
      children: [
        { path: ROUTES.login, element: <LoginLoadable /> },
        { path: "/login", element: <LoginLoadable /> },
        { path: ROUTES.register, element: <RegisterLoadable /> },
        { path: "/register", element: <RegisterLoadable /> },
        { path: ROUTES.forgotPassword, element: <ForgotPasswordLoadable /> },
        { path: ROUTES.resetPassword, element: <ResetPasswordLoadable /> },
        { path: "/reset-password", element: <ResetPasswordLoadable /> },
        { path: ROUTES.verifyEmail, element: <VerifyEmailLoadable /> },
        { path: "/verify-email", element: <VerifyEmailLoadable /> },
        { path: ROUTES.emailSent, element: <EmailSentLoadable /> },
        { path: ROUTES.accountPending, element: <AccountPendingLoadable /> },
        { path: ROUTES.sessionExpired, element: <SessionExpiredLoadable /> },
        { path: ROUTES.unauthorized, element: <UnauthorizedLoadable /> },
        { path: ROUTES.checkout, element: <CheckoutLoadable /> },
        { path: "/payments/checkout", element: <CheckoutLoadable /> },
        { path: ROUTES.paymentSuccess, element: <PaymentSuccessLoadable /> },
        { path: "/payments/success", element: <PaymentSuccessLoadable /> },
        { path: ROUTES.paymentFailure, element: <PaymentFailureLoadable /> },
        { path: "/payments/failure", element: <PaymentFailureLoadable /> },
        { path: ROUTES.player, element: <CoursePlayerLoadable /> },
        { path: "/player/course", element: <CoursePlayerLoadable /> },
      ],
    },
    // Fallbacks
    {
      path: "/not-found",
      element: <NotFoundLoadable />,
    },
    {
      path: "*",
      element: <Navigate to="/not-found" replace />,
    },
  ]);

  return routes;
}
