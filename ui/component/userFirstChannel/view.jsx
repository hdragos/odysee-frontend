// @flow
import * as MODALS from 'constants/modal_types';

import React, { useState } from 'react';
import { isNameValid } from 'util/lbryURI';
import Button from 'component/button';
import { Form, FormField } from 'component/common/form';
import { INVALID_NAME_ERROR } from 'constants/claim';
import Card from 'component/common/card';
import I18nMessage from 'component/i18nMessage';
import analytics from 'analytics';
import { sortLanguageMap } from 'util/default-languages';
import SUPPORTED_LANGUAGES from 'constants/supported_languages';
import Gerbil from 'component/channelThumbnail/gerbil.png';
import { THUMBNAIL_CDN_SIZE_LIMIT_BYTES } from 'config';
import * as ICONS from 'constants/icons';

export const DEFAULT_BID_FOR_FIRST_CHANNEL = 0.01;

type Props = {
  createChannel: (string, number) => Promise<ChannelClaim>,
  creatingChannel: boolean,
  createChannelError: string,
  claimingReward: boolean,
  user: User,
  languages: Array<string>,
  doToggleInterestedInYoutubeSync: () => void,
  openModal: (
    id: string,
    { onUpdate: (string, boolean) => void, assetName: string, helpText: string, currentValue: string, title: string }
  ) => void,
};

function UserFirstChannel(props: Props) {
  const {
    createChannel,
    creatingChannel,
    claimingReward,
    user,
    languages = [],
    createChannelError,
    doToggleInterestedInYoutubeSync,
    openModal,
  } = props;
  const { primary_email: primaryEmail } = user;
  const initialChannel = primaryEmail ? primaryEmail.split('@')[0] : '';
  const [channel, setChannel] = useState(initialChannel);
  const [title, setTitle] = useState(initialChannel);
  const [isUpload, setIsUpload] = React.useState({ cover: false, thumbnail: false });
  const [thumbError, setThumbError] = React.useState(false);
  const [params, setParams]: [any, (any) => void] = React.useState(getChannelParams());

  const LANG_NONE = 'none';
  const languageParam = params.languages;
  const primaryLanguage = Array.isArray(languageParam) && languageParam.length && languageParam[0];
  const [nameError, setNameError] = useState(undefined);

  function getChannelParams() {
    // fill this in with sdk data
    const channelParams: {
      title: string,
      languages: ?Array<string>,
    } = {
      title,
      languages: languages || [],
    };
    return channelParams;
  }

  let thumbnailPreview;
  if (!params.thumbnailUrl) {
    thumbnailPreview = Gerbil;
  } else if (thumbError) {
    thumbnailPreview = ThumbnailBrokenImage;
  } else {
    thumbnailPreview = params.thumbnailUrl;
  }

  function handleThumbnailChange(thumbnailUrl: string, uploadSelected: boolean) {
    setParams({ ...params, thumbnailUrl });
    setIsUpload({ ...isUpload, thumbnail: uploadSelected });
    setThumbError(false);
  }

  function handleCreateChannel() {
    createChannel(`@${channel}`, DEFAULT_BID_FOR_FIRST_CHANNEL).then((channelClaim) => {
      if (channelClaim) {
        analytics.apiLogPublish(channelClaim);
      }
    });
  }

  function handleChannelChange(e) {
    const { value } = e.target;
    setChannel(value);
    if (!isNameValid(value)) {
      setNameError(INVALID_NAME_ERROR);
    } else {
      setNameError();
    }
  }

  return (
    <div className="main__channel-creation">
      <Card
        title={__('Create a Channel')}
        subtitle={
          <React.Fragment>
            <p>{__('Your channel will be used for publishing and commenting.')}</p>
            <p>{__('You can have more than one or remove it later.')}</p>
          </React.Fragment>
        }
        actions={
          <Form onSubmit={handleCreateChannel}>
            <fieldset-group class="fieldset-group--smushed fieldset-group--disabled-prefix">
              <fieldset-section>
                <label htmlFor="auth_first_channel">
                  {createChannelError || nameError ? (
                    <span className="error__text">{createChannelError || nameError}</span>
                  ) : (
                    __('Your Channel')
                  )}
                </label>
                <div className="form-field__prefix">@</div>
              </fieldset-section>

              <FormField
                autoFocus
                placeholder={__('channel')}
                type="text"
                name="auth_first_channel"
                className="form-field"
                value={channel}
                onChange={handleChannelChange}
              />
            </fieldset-group>
            <fieldset-section>
              <FormField
                type="text"
                name="channel_title2"
                label={__('Title')}
                placeholder={__('My Awesome Channel')}
                value={title}
                onChange={handleChannelChange}
              />
            </fieldset-section>
            <fieldset-section>
              <label>Avatar</label>
              <img className="form-field__avatar" src={Gerbil} />
              <Button
                button="alt"
                title={__('Edit')}
                onClick={() =>
                  openModal(MODALS.IMAGE_UPLOAD, {
                    onUpdate: (thumbnailUrl, isUpload) => handleThumbnailChange(thumbnailUrl, isUpload),
                    title: __('Edit Thumbnail Image'),
                    helpText: __('(1:1 ratio, %max_size%MB max)', {
                      max_size: THUMBNAIL_CDN_SIZE_LIMIT_BYTES / (1024 * 1024),
                    }),
                    assetName: __('Thumbnail'),
                    currentValue: params.thumbnailUrl,
                  })
                }
                icon={ICONS.CAMERA}
                iconSize={18}
              />
            </fieldset-section>
            <fieldset-section>
              <FormField
                name="language_select"
                type="select"
                label={__('Primary Language')}
                onChange={(event) => handleLanguageChange(0, event.target.value)}
                value={primaryLanguage}
                helper={__('Your main content language')}
              >
                <option key={'pri-langNone'} value={LANG_NONE}>
                  {__('None selected')}
                </option>
                {sortLanguageMap(SUPPORTED_LANGUAGES).map(([langKey, langName]) => (
                  <option key={langKey} value={langKey}>
                    {langName}
                  </option>
                ))}
              </FormField>
            </fieldset-section>
            <div className="section__actions">
              <Button
                button="primary"
                type="submit"
                disabled={nameError || !channel || creatingChannel || claimingReward}
                label={creatingChannel || claimingReward ? __('Creating') : __('Create')}
              />
            </div>
            <div className="help--card-actions">
              <I18nMessage
                tokens={{
                  sync_channel: (
                    <Button
                      button="link"
                      label={__('Sync it and skip this step')}
                      onClick={() => doToggleInterestedInYoutubeSync()}
                    />
                  ),
                }}
              >
                Have a YouTube channel? %sync_channel%.
              </I18nMessage>
            </div>
          </Form>
        }
      />
    </div>
  );
}

export default UserFirstChannel;
