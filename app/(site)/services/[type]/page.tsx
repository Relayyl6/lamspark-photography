import SessionDetailPage, { generateMetadata } from "../../sessions/[type]/page";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export { generateMetadata };

export default SessionDetailPage;
