import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import ProductsPage from "./pages/product/ProductsPage";
import CreateProductPage from "./pages/product/CreateProduct";
import DashboardLayout from "../src/pages/Dashboard";
import CategoriesPage from "./pages/CategoryPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { PERMISSIONS } from "./config/permissions";
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
//sellers
import SellerPage from "./pages/sellers/SellerPage";
//terms and conditions
import TermsAndConditions from "./pages/terms/TermsAndConditions";
//admin management
import AdminManagement from "./pages/admin/AdminManagement";
import AdminForm from "./pages/admin/AdminForm";
//role management
import RoleManagement from "./pages/roles/RoleManagement";
import RoleForm from "./pages/roles/RoleForm";
<<<<<<< HEAD
//payouts
=======
>>>>>>> 824eefda645045997a79650b0f6a514170df0ffc
import PromotorPayouts from "./pages/payouts/PromotorPayouts";
import SellerPayouts from "./pages/payouts/SellerPayouts";
import PayoutHistory from "./pages/payouts/PayoutHistory";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Dashboard routes with layout */}
        <Route element={<DashboardLayout />}>
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.DASHBOARD_VIEW}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.USERS_VIEW}>
                <UsersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/products" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.PRODUCTS_VIEW}>
                <ProductsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/createProduct" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.PRODUCTS_CREATE}>
                <CreateProductPage/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/categories" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.CATEGORIES_VIEW}>
                <CategoriesPage />
              </ProtectedRoute>
            } 
          />

          {/* Promotors */}
          
          <Route 
            path="/admin/promotors" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.PROMOTORS_VIEW}>
                <PromotorPage/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/create-promotor" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.PROMOTORS_CREATE}>
                <CreatePromotorPage/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/edit-promotor/:id" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.PROMOTORS_EDIT}>
                <EditPromotorPage/>
              </ProtectedRoute>
            } 
          />

          {/* Warehouse */}
      
          <Route 
            path="/admin/warehouses" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.WAREHOUSES_VIEW}>
                <WareHouseList/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/agents" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.WAREHOUSES_VIEW}>
                <WareHouseList/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/create-warehouse" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.WAREHOUSES_CREATE}>
                <CreateWarehouse/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/edit-warehouse/:id" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.WAREHOUSES_EDIT}>
                <EditWareHouse/>
              </ProtectedRoute>
            } 
          />

          {/* Delivery Boy */}

          <Route 
            path="/admin/drivers" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.DRIVERS_VIEW}>
                <DriverList/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/create-driver" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.DRIVERS_CREATE}>
                <EditDriver/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/edit-driver/:id" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.DRIVERS_EDIT}>
                <EditDriver/>
              </ProtectedRoute>
            } 
          />
          
          {/* Orders */}

          <Route 
            path="/admin/orders" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.ORDERS_VIEW}>
                <OrderList/>
              </ProtectedRoute>
            } 
          /> 


          {/* Marketing */}

          <Route 
            path="/admin/banners" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.BANNERS_VIEW}>
                <Banners/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/coupons" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.COUPONS_VIEW}>
                <Coupon/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/discounts" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.DISCOUNTS_VIEW}>
                <Discounts/>
              </ProtectedRoute>
            } 
          />

          {/* Sellers */}

          <Route 
            path="/admin/sellers" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.SELLERS_VIEW}>
                <SellerPage/>
              </ProtectedRoute>
            } 
          />

          {/* Terms and Conditions */}

          <Route 
            path="/admin/terms" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.TERMS_VIEW}>
                <TermsAndConditions/>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/admins" 
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <AdminManagement/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/create-admin" 
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <AdminForm/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/edit-admin/:id" 
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <AdminForm/>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/roles" 
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <RoleManagement/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/create-role" 
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <RoleForm/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/edit-role/:id" 
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <RoleForm/>
              </ProtectedRoute>
            } 
          />
          {/* Payouts */}
          <Route 
            path="/admin/payouts/promotors" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.PROMOTORS_VIEW}>
                <PromotorPayouts/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/payouts/sellers" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.SELLERS_VIEW}>
                <SellerPayouts/>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/payouts/history" 
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.DASHBOARD_VIEW}>
                <PayoutHistory/>
              </ProtectedRoute>
            } 
          />

        </Route>
      </Routes>
    </Router>
  );
}
 
export default App;