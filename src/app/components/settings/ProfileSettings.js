/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import Divider from "@material-ui/core/Divider";

import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";

import PasswordForm from "../settings/profile/PasswordForm";
import EmailForm from "../settings/profile/EmailForm";
import FirstNameForm from "../settings/profile/FirstNameForm";
import UserNameForm from "../settings/profile/UserNameForm";
import AvatarForm from "../settings/profile/AvatarForm";

export default function ProfileSettings(props) {
  const profile = useSelector(state => state.user.profile);

  const _editUserName = () => {
    props.onModal(
      <UserNameForm
        onSubmit={() => props.onModal()}
        onClose={() => props.onModal()}
      />
    );
  };

  const _editPassword = () => {
    props.onModal(
      <PasswordForm
        onSubmit={() => props.onModal()}
        onClose={() => props.onModal()}
      />
    );
  };

  const _editFirstName = () => {
    props.onModal(
      <FirstNameForm
        onSubmit={() => props.onModal()}
        onClose={() => props.onModal()}
      />
    );
  };

  const _editMail = () => {
    props.onModal(
      <EmailForm
        onSubmit={() => props.onModal()}
        onClose={() => props.onModal()}
      />
    );
  };

  const _editAvatar = () => {
    props.onModal(
      <AvatarForm
        avatar={profile.profile.avatar}
        onSubmit={() => props.onModal()}
        onClose={() => props.onModal()}
      />
    );
  };

  const avatars = {
    NONE: "None",
    GRAVATAR: "Gravatar",
    NOMADLIST: "Nomadlist"
  };

  return (
    <List className="wrapperMobile">
      <ListItem button onClick={_editUserName}>
        <ListItemText primary="Username" secondary={profile.username} />
        <KeyboardArrowRight />
      </ListItem>
      <ListItem button onClick={_editFirstName}>
        <ListItemText primary="Firstname" secondary={profile.first_name} />
        <KeyboardArrowRight />
      </ListItem>
      <ListItem button onClick={_editMail}>
        <ListItemText primary="Email" secondary={profile.email} />
        <KeyboardArrowRight />
      </ListItem>
      <ListItem button onClick={_editAvatar}>
        <ListItemText
          primary="Avatar"
          secondary={
            profile.profile && profile.profile.avatar
              ? avatars[profile.profile.avatar]
              : "None"
          }
        />
        <KeyboardArrowRight />
      </ListItem>
      <Divider />
      <ListItem button onClick={_editPassword}>
        <ListItemText
          primary="Change password"
          secondary="Do not neglect security"
        />
        <KeyboardArrowRight />
      </ListItem>
    </List>
  );
}
