/**
 * group-activity-lesson lifecycles
 *
 * Auto-generates `internalDisplayName` from the entry title.
 */

function setInternalDisplayName(event) {
  const { data } = event.params;
  if (data?.title) {
    data.internalDisplayName = data.title;
  }
}

export default {
  beforeCreate(event) {
    setInternalDisplayName(event);
  },
  beforeUpdate(event) {
    setInternalDisplayName(event);
  },
};
