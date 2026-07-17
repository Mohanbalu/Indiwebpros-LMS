import { lazy, Suspense } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { BlankLayout } from "@/layouts/BlankLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FullScreenLoader } from "@/components/common/FullScreenLoader";
import { ROUTES } from "@/config/routes.config";
import { useAuth } from "@/context/AuthContext";

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
const QuizPage = lazy(() => import("@/pages/QuizPage"));
const MyCertificates = lazy(() => import("@/pages/MyCertificates"));
const CertificateDetail = lazy(() => import("@/pages/CertificateDetail"));
const CertificateVerify = lazy(() => import("@/pages/CertificateVerify"));

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
const QuizPageLoadable = Loadable(QuizPage);
const MyCertificatesLoadable = Loadable(MyCertificates);
const CertificateDetailLoadable = Loadable(CertificateDetail);
const CertificateVerifyLoadable = Loadable(CertificateVerify);

export function AppRoutes() {
  const { user, loading } = useAuth();

  const routes = useRoutes(
    user
      ? [
          // Authenticated layout - everything uses DashboardLayout (sidebar)
          {
            path: "/",
            element: <DashboardLayout />,
            children: [
              // Home page and other public pages render inside DashboardLayout for logged-in users
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
              { path: ROUTES.certificateVerify, element: <CertificateVerifyLoadable /> },

              // Standard dashboard pages
              { path: ROUTES.dashboard, element: <DashboardLoadable /> },
              { path: ROUTES.profile, element: <ProfileLoadable /> },
              { path: ROUTES.certificates, element: <MyCertificatesLoadable /> },
              { path: ROUTES.certificateDetail, element: <CertificateDetailLoadable /> },

              // Role-specific sub-routes (additional security checks)
              {
                element: <ProtectedRoute requiredRoles={["Instructor", "Admin"]} />,
                children: [{ path: "/instructor", element: <DashboardLoadable /> }]
              },
              {
                element: <ProtectedRoute requiredRoles={["Student"]} />,
                children: [{ path: "/student", element: <DashboardLoadable /> }]
              },
              {
                element: <ProtectedRoute requiredRoles={["Mentor"]} />,
                children: [{ path: "/mentor", element: <DashboardLoadable /> }]
              },
              {
                element: <ProtectedRoute requiredRoles={["Admin"]} />,
                children: [{ path: "/admin", element: <DashboardLoadable /> }]
              }
            ]
          },
          // Full-screen protected routes (no sidebar)
          { path: ROUTES.player, element: <CoursePlayerLoadable /> },
          { path: ROUTES.quiz, element: <QuizPageLoadable /> },
          // Payment routes (no sidebar, protected)
          { path: ROUTES.checkout, element: <CheckoutLoadable /> },
          { path: ROUTES.paymentSuccess, element: <PaymentSuccessLoadable /> },
          { path: ROUTES.paymentFailure, element: <PaymentFailureLoadable /> },

          // Auth pages redirect back to dashboard if logged in
          {
            path: "/",
            element: <BlankLayout />,
            children: [
              { path: ROUTES.login, element: <Navigate to="/dashboard" replace /> },
              { path: ROUTES.register, element: <Navigate to="/dashboard" replace /> },
              { path: "/login", element: <Navigate to="/dashboard" replace /> },
              { path: "/register", element: <Navigate to="/dashboard" replace /> },
              { path: ROUTES.forgotPassword, element: <Navigate to="/dashboard" replace /> },
              { path: ROUTES.resetPassword, element: <Navigate to="/dashboard" replace /> }
            ]
          },
          // Fallbacks
          { path: "/not-found", element: <NotFoundLoadable /> },
          { path: "*", element: <Navigate to="/not-found" replace /> }
        ]
      : [
          // Unauthenticated layout - public pages use PublicLayout (top navbar)
          {
            path: "/",
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
              { path: ROUTES.certificateVerify, element: <CertificateVerifyLoadable /> }
            ]
          },
          // Protected pages redirect to login for guests
          {
            element: <ProtectedRoute />, // Will redirect to login automatically
            children: [
              { path: ROUTES.dashboard, element: <Navigate to={ROUTES.login} replace /> },
              { path: "/student", element: <Navigate to={ROUTES.login} replace /> },
              { path: "/instructor", element: <Navigate to={ROUTES.login} replace /> },
              { path: "/mentor", element: <Navigate to={ROUTES.login} replace /> },
              { path: "/admin", element: <Navigate to={ROUTES.login} replace /> },
              { path: ROUTES.profile, element: <Navigate to={ROUTES.login} replace /> },
              { path: ROUTES.certificates, element: <Navigate to={ROUTES.login} replace /> },
              { path: ROUTES.player, element: <Navigate to={ROUTES.login} replace /> },
              { path: ROUTES.quiz, element: <Navigate to={ROUTES.login} replace /> },
              { path: ROUTES.checkout, element: <Navigate to={ROUTES.login} replace /> }
            ]
          },
          // Authentication routes (uses BlankLayout)
          {
            path: "/",
            element: <BlankLayout />,
            children: [
              { path: "/login", element: <Navigate to={ROUTES.login} replace /> },
              { path: "/register", element: <Navigate to={ROUTES.register} replace /> },
              { path: ROUTES.login, element: <LoginLoadable /> },
              { path: ROUTES.register, element: <RegisterLoadable /> },
              { path: ROUTES.forgotPassword, element: <ForgotPasswordLoadable /> },
              { path: ROUTES.resetPassword, element: <ResetPasswordLoadable /> },
              { path: "/reset-password", element: <ResetPasswordLoadable /> },
              { path: ROUTES.verifyEmail, element: <VerifyEmailLoadable /> },
              { path: "/verify-email", element: <VerifyEmailLoadable /> },
              { path: ROUTES.emailSent, element: <EmailSentLoadable /> },
              { path: ROUTES.accountPending, element: <AccountPendingLoadable /> },
              { path: ROUTES.sessionExpired, element: <SessionExpiredLoadable /> },
              { path: ROUTES.unauthorized, element: <UnauthorizedLoadable /> }
            ]
          },
          // Fallbacks
          { path: "/not-found", element: <NotFoundLoadable /> },
          { path: "*", element: <Navigate to="/not-found" replace /> }
        ]
  );

  if (loading) {
    return <FullScreenLoader />;
  }

  return routes;
}
