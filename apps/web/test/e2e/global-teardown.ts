import { resetLocalDatabase } from "./helpers";

export default function globalTeardown() {
  resetLocalDatabase();
}
