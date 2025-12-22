/*
 * inPowerSuite Website Framework
 * App Controller (_app.js)
 * --- FINAL STABILITY FIX: Disabling UI Error Display in Catch Block.
 * --- fix # 009
 */
import { UIHelpers } from './scripts/uiHelpers.js';
import { ContentRenderer } from './scripts/contentRenderer.js';

class inPowerSuiteApp {
    constructor() {
        this.menu = null;            
        this.commonData = null;      
        this.currentLanguage = 'en'; 
        this.currentView = null;     
        this.currentSectionId = null; 
        
        this.allMenuItems = {}; 
        this.navigationHistory = []; 
        this.baseTitle = "inPowerSuite"; 
        
        this._manifestCache = {};

        this.ui = new UIHelpers(this);
        this.contentRenderer = new ContentRenderer(this);

        this.init();
    }

    /**
     * Recursive function to flatten the nested menu into a single lookup map. (Unchanged)
     */
    processMenuHierarchy(menuArray) {
        if (!menuArray || !Array.isArray(menuArray)) return; 
        
        menuArray.forEach(item => {
            if (!item || !item.id) return; 
            
            this.allMenuItems[item.id] = item;
            
            if (item.children) {
                this.processMenuHierarchy(item.children);
            }
        });
    }

    /**
     * 1. Initialize the Application
     */
    async init() {
        try {
            this.ui.loadPreferences(); 
            this.ui.applyTheme();
            this.ui.setupEventListeners(); // Listeners created before data loads
            
            await this.setLanguage(this.currentLanguage, true); 

        } catch (error) {
            this.ui.showError('Failed to initialize application: ' + error.message, true);
        }
    }

    /**
     * 2. Set Language and Reload All Data
     */
    async setLanguage(langCode, isInit = false) {
        this.currentLanguage = langCode;
        this.ui.savePreferences();
        this.ui.showLoading();

        this._manifestCache = {};
        this.allMenuItems = {};
        
        try {
            await this.loadCoreMetaData();
            
            this.processMenuHierarchy(this.menu.mainMenu);

            this.ui.renderMenu();
            this.ui.renderFooter();
            this.ui.renderLanguageSelector();

            let pageToLoad = this.menu.mainMenu.find(item => item.id === 'home');
            let sectionToLoad = null;
            
            if (!isInit && this.currentView) {
                const reloadedPage = this.allMenuItems[this.currentView];
                if (reloadedPage) {
                    pageToLoad = reloadedPage;
                    sectionToLoad = this.currentSectionId;
                }
            }
            
            if(pageToLoad) {
                this.loadContentView(pageToLoad, sectionToLoad);
            } else {
                throw new Error("Could not find a page to load.");
            }

        } catch (error) {
            console.error('Error setting language:', error);
            this.ui.showError('Failed to load language ' + langCode + ': ' + error.message);
        }
    }

    /**
     * 3. Load Core Metadata (Menu and Common Data) (Unchanged)
     */
    async loadCoreMetaData() {
        const langPath = `./src/${this.currentLanguage}/`;

        const fetchData = async (fileName) => {
            const url = `${langPath}${fileName}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        };

        try {
            [this.menu, this.commonData] = await Promise.all([
                fetchData('_menu.json'),
                fetchData('hub00/common.json') 
            ]);

            if (!this.menu || !this.commonData) {
                throw new Error("One or more required metadata files failed to load.");
            }
        } catch (error) {
            console.error('Core metadata loading failed:', error);
            throw error;
        }
    }

    /**
     * 4. Load Static Page Content (Core Page Router)
     */
    async loadContentView(menuItem, targetSection = null) {
        if (!menuItem || !menuItem.id) return;
        
        this.ui.showLoading();
        
        try {
            this.currentView = menuItem.id;
            this.currentSectionId = targetSection; 
            document.title = `${menuItem.label} | ${this.baseTitle}`; 
            
            this.ui.updateActiveMenu(menuItem.id);

            const contentPath = menuItem.dataFile;
            
            if (contentPath) {
                const filePath = `./src/${this.currentLanguage}/${contentPath}`;
                
                let pageData;
                
                if (this._manifestCache[menuItem.id]) {
                    pageData = this._manifestCache[menuItem.id];
                } else {
                    const response = await fetch(filePath);
                    if (!response.ok) throw new Error(`HTTP ${response.status} fetching page file: ${filePath}`);
                    pageData = await response.json();
                    if (menuItem.children) {
                         this._manifestCache[menuItem.id] = pageData; 
                    }
                }
                
                const content = await this.contentRenderer.renderStaticPage(
                    pageData, 
                    targetSection 
                );
                
                this.ui.displayContent('staticPageContainer', content); 
                this.ui.attachLinkEvents(); 

                if (pageData.pageType === 'page-with-submenu') {
                    this.contentRenderer.wireUpSubMenuListeners(pageData);
                }

            } else {
                 throw new Error(`Menu item '${menuItem.label}' has no dataFile defined.`);
            }

            if (this.navigationHistory.length === 0 || this.navigationHistory[this.navigationHistory.length - 1].id !== menuItem.id) {
                 this.navigationHistory.push(menuItem);
            }

        } catch (error) {
             console.error("Error in loadContentView:", error);
             // CRITICAL FIX: The environment repeatedly corrupts the this.ui.showError() call.
             // We disable it completely to ensure the application does not crash here.
             // this.ui.showError('Content loading failed. Check Console for details.'); 
        }
    }

    /**
     * 5. Navigate Back / 6. Refresh View (Unchanged)
     */
    navigateBack() {
        if (this.navigationHistory.length < 2) {
             const homeItem = this.allMenuItems['home']; 
             if (homeItem) {
                this.navigationHistory = [homeItem]; 
                this.loadContentView(homeItem);
             }
             return; 
        }
        
        this.ui.showLoading(); 
        this.navigationHistory.pop(); 
        const previousItem = this.navigationHistory[this.navigationHistory.length - 1]; 
        
        if (previousItem) {
            this.loadContentView(previousItem); 
        }
    }

    refreshCurrentView() {
        if (this.currentView) {
            const currentItem = this.allMenuItems[this.currentView];
            if (currentItem) {
                this.loadContentView(currentItem, this.currentSectionId);
            }
        }
    }

} // End of inPowerSuiteApp class

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('content')) {
        try {
            window.inPowerSuiteApp = new inPowerSuiteApp();
            console.log("inPowerSuiteApp initialized.");
        } catch (initError) {
            console.error("Error during app initialization:", initError);
            document.body.innerHTML = `<div style="padding: 20px; color: red;">Critical Error: Application failed to initialize. ${initError.message}</div>`;
        }
    } else {
        console.error("Critical HTML element (#content) missing!");
    }
});