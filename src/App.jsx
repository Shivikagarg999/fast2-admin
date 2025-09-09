import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import ProductsPage from "./pages/product/ProductsPage";
import CreateProductPage from "./pages/product/CreateProduct";
import DashboardLayout from "../src/pages/Dashboard";
import CategoriesPage from "./pages/CategoryPage";
//promotor
import CreatePromotorPage from "./pages/promotor/CreatePromotor";
import PromotorPage from "./pages/promotor/PromotorPage";
import EditPromotorPage from "./pages/promotor/EditPromotor";
//warehouse
import WareHouseList from "./pages/warehouse/WareHouseList";
import CreateWarehouse from "./pages/warehouse/CreateWarehouse";
import EditWareHouse from "./pages/warehouse/EditWarehouse";

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
          <Route path="/admin/createProduct" element={<CreateProductPage/>} />
          <Route path="/admin/categories" element={<CategoriesPage />} />

          {/* Promotors */}
          
          <Route path="/admin/promotors" element={<PromotorPage/>} />
          <Route path="/admin/create-promotor" element={<CreatePromotorPage/>} />
          <Route path="/admin/edit-promotor/:id" element={<EditPromotorPage/>} />

          {/* Warehouse */}
      
          <Route path="/admin/warehouses" element={<WareHouseList/>} />
          <Route path="/admin/create-warehouse" element={<CreateWarehouse/>} />
          <Route path="/admin/edit-warehouse/:id" element={<EditWareHouse/>} />

        </Route>
      </Routes>
    </Router>
  );
}
 
export default App;