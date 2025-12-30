// get the id of the requester
export const getRequesterId = (requester) => {
  if (!requester) return undefined;
  if (requester.id) return requester.id.toString();
  if (requester._id) return requester._id.toString();
  return undefined;
};

// build an error with a status code
export const buildError = (message, statusCode = 403) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// assert the requester is an admin
export const assertAdmin = (requester, action = 'perform this action') => {
  if (requester?.role === 'admin') return;
  throw buildError(`You are not authorized to ${action}`, 403);
};

// assert the requester is the owner of the resource or an admin
export const assertOwnerOrAdmin = (ownerId, requester, action = 'access this resource') => {
  if (requester?.role === 'admin') return;
  const requesterId = getRequesterId(requester);
  if (!ownerId || !requesterId || ownerId.toString() !== requesterId) {
    throw buildError(`You are not authorized to ${action}`, 403);
  }
};

// assert the requester is the same user as the target user or an admin
export const assertSameUserOrAdmin = (targetUserId, requester, action = 'access this resource') => {
  if (requester?.role === 'admin') return;
  const requesterId = getRequesterId(requester);
  if (!targetUserId || !requesterId || targetUserId.toString() !== requesterId) {
    throw buildError(`You are not authorized to ${action}`, 403);
  }
};

