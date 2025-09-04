import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import ProductsPage from "./pages/ProductsPage";
import DashboardLayout from "../src/pages/Dashboard";
import CategoriesPage from "./pages/CategoryPage";
import CreateProductPage from "./pages/CreateProduct";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Dashboard routes with layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/categories" element={<CategoriesPage />} />
          <Route path="/admin/createProduct" element={<CreateProductPage/>} />
        </Route>
      </Routes>
    </Router>
  );
}
 
export default App;