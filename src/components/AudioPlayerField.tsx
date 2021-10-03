import * as React from "react";
import PropTypes from 'prop-types';
import { useRecordContext } from 'react-admin';
interface PropTypes { 
  source: string;
}
const AudioPlayerField = (props: PropTypes) => {
    const { source } = props;
    const record = useRecordContext(props);
    return (
      <audio controls crossOrigin="anonymous">
        <source src={record.file} type="audio/mpeg"  />
        Your browser does not support the audio tag.
      </audio>
    );
}

AudioPlayerField.propTypes = {
    label: PropTypes.string,
    record: PropTypes.object,
    source: PropTypes.string.isRequired,
};

export default AudioPlayerField;
