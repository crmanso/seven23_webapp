import React from "react";
import moment from "moment";
import { useDispatch } from "react-redux";

import List from "@material-ui/core/List";
import ListSubheader from "@material-ui/core/ListSubheader";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";

import Divider from "@material-ui/core/Divider";
import RefreshIcon from "@material-ui/icons/Refresh";
import ExitToApp from "@material-ui/icons/ExitToApp";
import DeleteForever from "@material-ui/icons/DeleteForever";

import UserActions from "../../actions/UserActions";
import AppActions from "../../actions/AppActions";

export default function AppSettings() {
  const dispatch = useDispatch();

  return (
    <div
      className="layout_content wrapperMobile"
      subheader={
        <ListSubheader disableSticky={true}>Authentication</ListSubheader>
      }
    >
      <List>
        <ListItem>
          <ListItemText
            primary="Build date"
            secondary={
              process.env.BUILD_DATE
                ? moment(process.env.BUILD_DATE).toString()
                : "NC"
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Commit number"
            secondary={process.env.TRAVIS_COMMIT || "NC"}
          />
        </ListItem>
        <Divider />
        <ListItem button onClick={() => AppActions.reload()}>
          <ListItemIcon>
            <RefreshIcon />
          </ListItemIcon>
          <ListItemText
            primary="Force reload"
            secondary="Reload current page"
          />
        </ListItem>
        <ListItem button onClick={() => dispatch(UserActions.logout(true))}>
          <ListItemIcon>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText
            primary="Force logout"
            secondary="Will ignore sync status"
          />
        </ListItem>
        <ListItem button onClick={() => dispatch(AppActions.reset())}>
          <ListItemIcon>
            <DeleteForever />
          </ListItemIcon>
          <ListItemText
            primary="Reset the app"
            secondary="Full reset of the app on your device"
          />
        </ListItem>
      </List>
    </div>
  );
}
