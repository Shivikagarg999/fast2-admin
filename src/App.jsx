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
//delivery boy
import DriverList from "./pages/deliveryboy/DeliveryBoyList";
import EditDriver from "./pages/deliveryboy/EditDriver";
//orders
import OrderList from "./pages/orders/Orders";
//marketing
import Banners from "./pages/banners/Banners";
import Coupon from "./pages/coupon-code/CouponCode";
import Discounts from "./pages/discounts/page";

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
          <Route path="/admin/agents" element={<WareHouseList/>} />
          <Route path="/admin/create-warehouse" element={<CreateWarehouse/>} />
          <Route path="/admin/edit-warehouse/:id" element={<EditWareHouse/>} />

          {/* Delivery Boy */}

          <Route path="/admin/drivers" element={<DriverList/>} />
          <Route path="/admin/create-driver" element={<EditDriver/>} />
          <Route path="/admin/edit-driver/:id" element={<EditDriver/>} />
          
          {/* Orders */}

          <Route path="/admin/orders" element={<OrderList/>} /> 


          {/* Marketing */}

          <Route path="/admin/banners" element={<Banners/>} />
          <Route path="/admin/coupons" element={<Coupon/>} />
          <Route path="/admin/discounts" element={<Discounts/>} />

        </Route>
      </Routes>
    </Router>
  );
}
 
export default App;