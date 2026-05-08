/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Agenda from './pages/Agenda';
import FacialAnalysis from './pages/FacialAnalysis';
import CRM from './pages/CRM';
import Dashboard from './pages/Dashboard';
import Financial from './pages/Financial';
import Inventory from './pages/Inventory';
import MedicalRecords from './pages/MedicalRecords';
import Patients from './pages/Patients';
import Pricing from './pages/Pricing';
import Protocols from './pages/Protocols';
import Settings from './pages/Settings';
import Intake from './pages/Intake';
import Chat from './pages/Chat';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Agenda": Agenda,
    "FacialAnalysis": FacialAnalysis,
    "CRM": CRM,
    "Dashboard": Dashboard,
    "Financial": Financial,
    "Inventory": Inventory,
    "MedicalRecords": MedicalRecords,
    "Patients": Patients,
    "Pricing": Pricing,
    "Protocols": Protocols,
    "Settings": Settings,
    "Intake": Intake,
    "Chat": Chat,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};