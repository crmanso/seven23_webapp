/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useRouter } from "../router";

import Card from "@material-ui/core/Card";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";

import IconButton from "@material-ui/core/IconButton";

import HelpIcon from "@material-ui/icons/HelpOutline";
import AccountBoxIcon from "@material-ui/icons/AccountBox";
import MoneyIcon from "@material-ui/icons/AttachMoney";
import CreditCard from "@material-ui/icons/CreditCard";
import StorageIcon from "@material-ui/icons/Storage";
import AvLibraryBooks from "@material-ui/icons/LibraryBooks";
import SettingsApplications from "@material-ui/icons/SettingsApplications";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import Lock from "@material-ui/icons/Lock";
import ImportExport from "@material-ui/icons/ImportExport";
import StyleIcon from "@material-ui/icons/Style";
import PowerSettingsNewIcon from "@material-ui/icons/PowerSettingsNew";
import AccountTreeIcon from "@material-ui/icons/AccountTree";

import AccountsSettings from "./settings/AccountsSettings";
import ProfileSettings from "./settings/ProfileSettings";
import HelpSettings from "./settings/HelpSettings";
import ServerSettings from "./settings/ServerSettings";
import AppSettings from "./settings/AppSettings";
import SecuritySettings from "./settings/SecuritySettings";
import CurrenciesSettings from "./settings/CurrenciesSettings";
import ImportExportSettings from "./settings/ImportExportSettings";
import ThemeSettings from "./settings/ThemeSettings";
import SubscriptionSettings from "./settings/SubscriptionSettings";
import SocialNetworksSettings from "./settings/SocialNetworksSettings";

import UserButton from "./settings/UserButton";

export default function Settings() {
  const { history } = useRouter();

  const SETTINGS = {
    PROFILE: {
      title: "User profile",
      url: "/settings/profile/",
      subtitle: "Configure your data",
      icon: <AccountBoxIcon />,
      component: (
        <ProfileSettings
          onModal={component => (component ? modal(component) : setOpen(false))}
          history={history}
        />
      )
    },
    ACCOUNTS: {
      title: "Accounts",
      url: "/settings/accounts/",
      subtitle: "Manage yours accounts",
      icon: <AvLibraryBooks />,
      component: (
        <AccountsSettings
          onModal={component => (component ? modal(component) : setOpen(false))}
        />
      )
    },
    CURRENCIES: {
      title: "Currencies",
      url: "/settings/currencies/",
      subtitle: "Select currencies to show",
      icon: <MoneyIcon />,
      component: <CurrenciesSettings />
    },
    SERVER: {
      title: "Server/Sync",
      url: "/settings/server/",
      subtitle: "Details about your hosting",
      icon: <StorageIcon />,
      component: <ServerSettings history={history} />
    },
    SECURITY: {
      title: "Security",
      url: "/settings/security/",
      subtitle: "Encryption key",
      icon: <Lock />,
      component: <SecuritySettings />
    },
    SUBSCRIPTION: {
      title: "Subscription",
      url: "/settings/subscription/",
      subtitle: "Paiement, invoice, and extend",
      icon: <CreditCard />,
      component: <SubscriptionSettings history={history} />
    },
    IMPORT_EXPORT: {
      title: "Import / Export",
      url: "/settings/import/export/",
      subtitle: "Backup and restore your data",
      icon: <ImportExport />,
      component: <ImportExportSettings />
    },
    SOCIAL_NETWORKS: {
      title: "Social networks",
      url: "/settings/social/",
      subtitle: "Connect your accounts",
      icon: <AccountTreeIcon />,
      component: (
        <SocialNetworksSettings
          onModal={component => (component ? modal(component) : setOpen(false))}
        />
      )
    },
    THEME: {
      title: "Theme",
      url: "/settings/theme/",
      subtitle: "Light or dark mode",
      icon: <StyleIcon />,
      component: <ThemeSettings />
    },
    APP: {
      title: "About the App",
      url: "/settings/application/",
      subtitle: "Version, force refresh",
      icon: <SettingsApplications />,
      component: <AppSettings />
    },
    HELP: {
      title: "Help / Support",
      url: "/settings/help/",
      subtitle: "Bug report, questions, or anything else",
      icon: <HelpIcon />,
      component: <HelpSettings />
    }
  };

  const server = useSelector(state => state.server);

  const [component, setComponent] = useState(null);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(
    SETTINGS[
      Object.keys(SETTINGS).find(
        key => SETTINGS[key].url === history.location.pathname
      )
    ]
  );
  const [pageTitle, setPageTitle] = useState(page ? page.title : "");

  useEffect(() => {
    if (page) {
      setPageTitle(page.title);
    }
  }, [page]);

  const modal = c => {
    setComponent(c);
    setOpen(true);
  };

  const drawListItem = _page => {
    return (
      <ListItem
        button
        onClick={(event, index) => {
          setPage(_page);
          history.push(_page.url);
        }}
        selected={page === _page}
      >
        <ListItemIcon>{_page.icon}</ListItemIcon>
        <ListItemText
          primary={_page ? _page.title : ""}
          secondary={_page ? _page.subtitle : ""}
        />
        <KeyboardArrowRight />
      </ListItem>
    );
  };

  return (
    <div className="layout">
      <div className={"modalContent " + (open ? "open" : "")}>
        <Card square className="modalContentCard">
          {component}
        </Card>
      </div>
      <header className="layout_header showMobile">
        <div className="layout_header_top_bar">
          <div
            className={(!page ? "show " : "") + "layout_header_top_bar_title"}
          >
            <h2>Settings</h2>
          </div>
          <div
            className={(page ? "show " : "") + "layout_header_top_bar_title"}
            style={{ right: 80 }}
          >
            <IconButton
              onClick={() => {
                setPage(null);
                history.push("/settings");
              }}
            >
              <KeyboardArrowLeft style={{ color: "white" }} />
            </IconButton>
            <h2 style={{ paddingLeft: 4 }}>{pageTitle}</h2>
          </div>
          <div className="showMobile">
            <UserButton history={history} type="button" color="white" />
          </div>
        </div>
      </header>

      <div className="layout_two_columns">
        <div className={(page ? "hide " : "") + "layout_content wrapperMobile"}>
          <List
            subheader={
              <ListSubheader disableSticky={true}>Your account</ListSubheader>
            }
          >
            {drawListItem(SETTINGS.ACCOUNTS)}
            {drawListItem(SETTINGS.IMPORT_EXPORT)}
            {drawListItem(SETTINGS.THEME)}
            {drawListItem(SETTINGS.SOCIAL_NETWORKS)}
          </List>

          {server.isLogged ? (
            <List
              subheader={
                <ListSubheader disableSticky={true}>Hosting</ListSubheader>
              }
            >
              {drawListItem(SETTINGS.PROFILE)}
              {drawListItem(SETTINGS.SERVER)}
              {drawListItem(SETTINGS.SECURITY)}
              {server.saas ? drawListItem(SETTINGS.SUBSCRIPTION) : ""}
              <Link to="/logout">
                <ListItem button>
                  <ListItemIcon>
                    <PowerSettingsNewIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Logout"
                    secondary={`Disconnect from ${server.name}`}
                  />
                </ListItem>
              </Link>
            </List>
          ) : (
            ""
          )}

          <List
            subheader={
              <ListSubheader disableSticky={true}>More settings</ListSubheader>
            }
          >
            {drawListItem(SETTINGS.APP)}
            {drawListItem(SETTINGS.HELP)}
          </List>
        </div>

        {page ? <div className="layout_noscroll">{page.component}</div> : ""}
      </div>
    </div>
  );
}
