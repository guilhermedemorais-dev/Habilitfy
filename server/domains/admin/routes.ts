import type { Express, RequestHandler, Response } from "express";
import type { IStorage } from "../../storage";

type RegisterAdminCoreRoutesParams = {
  app: Express;
  isAuthenticated: RequestHandler;
  storage: IStorage;
  sanitizeSensitiveData: <T>(value: T) => T;
};

const resolveAdmin = async (
  storage: IStorage,
  req: any,
  res: Response,
) => {
  const userId = req.user?.claims?.sub ?? req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  const user = await storage.getUser(userId);
  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }

  return user;
};

export const registerAdminCoreRoutes = ({
  app,
  isAuthenticated,
  storage,
  sanitizeSensitiveData,
}: RegisterAdminCoreRoutesParams) => {
  app.get("/api/admin/instructors", isAuthenticated, async (req: any, res: Response) => {
    try {
      const adminUser = await resolveAdmin(storage, req, res);
      if (!adminUser) return;

      const status = req.query.status as string | undefined;
      const instructors = await storage.getInstructorsWithUser(status);
      res.json(sanitizeSensitiveData(instructors));
    } catch (error) {
      console.error("Error fetching instructors:", error);
      res.status(500).json({ message: "Failed to fetch instructors" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res: Response) => {
    try {
      const adminUser = await resolveAdmin(storage, req, res);
      if (!adminUser) return;

      const role = req.query.role as string | undefined;
      const users = await storage.getUsers(role);
      res.json(sanitizeSensitiveData(users));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
};
