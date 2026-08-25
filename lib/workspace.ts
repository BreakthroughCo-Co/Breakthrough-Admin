// Google Workspace API Client Helpers

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  hangoutLink?: string;
  location?: string;
}

export interface GoogleContact {
  resourceName: string;
  etag: string;
  names?: { displayName: string; familyName?: string; givenName?: string }[];
  emailAddresses?: { value: string; type?: string }[];
  phoneNumbers?: { value: string; type?: string }[];
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: string;
  completed?: string;
}

export interface GoogleForm {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  responderUri?: string;
  revisionId?: string;
  items?: GoogleFormItem[];
}

export interface GoogleFormItem {
  itemId?: string;
  title: string;
  description?: string;
  questionItem?: {
    question: {
      questionId?: string;
      required?: boolean;
      choiceQuestion?: {
        type: 'RADIO' | 'CHECKBOX' | 'DROP_DOWN';
        options: { value: string }[];
      };
      textQuestion?: {
        paragraph?: boolean;
      };
      scaleQuestion?: {
        low: number;
        high: number;
        lowLabel?: string;
        highLabel?: string;
      };
    };
  };
}

export interface GoogleFormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
  answers?: Record<string, {
    questionId: string;
    textAnswers?: { answers: { value: string }[] };
  }>;
}

export interface GoogleMeetSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
  config?: {
    accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
    entryPointAccess?: 'ALL' | 'CREATOR_APP_ONLY';
  };
  activeConference?: {
    conferenceRecord?: string;
  };
}

export interface GoogleKeepNote {
  name: string;
  title: string;
  body?: {
    text?: { text: string };
    list?: { listItems: { text: { text: string }; checked: boolean }[] };
  };
  createTime?: string;
  updateTime?: string;
  trashTime?: string;
  trashed?: boolean;
}

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export const listDriveFiles = async (
  accessToken: string,
  query?: string,
  maxFiles = 1000
): Promise<GoogleDriveFile[]> => {
  let allFiles: GoogleDriveFile[] = [];
  let pageToken: string | undefined = undefined;

  try {
    do {
      const pageSize = Math.min(1000, Math.max(1, maxFiles - allFiles.length));
      let url = `https://www.googleapis.com/drive/v3/files?fields=nextPageToken,files(id,name,mimeType,webViewLink,modifiedTime,size)&pageSize=${pageSize}&orderBy=modifiedTime desc`;
      if (query) {
        url += `&q=${encodeURIComponent(`name contains '${query}' and trashed = false`)}`;
      } else {
        url += `&q=${encodeURIComponent('trashed = false')}`;
      }
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Failed to fetch Drive files: ${res.statusText}`);
      }
      const data = await res.json();
      const files: GoogleDriveFile[] = data.files || [];
      allFiles.push(...files);
      pageToken = data.nextPageToken;
    } while (pageToken && allFiles.length < maxFiles);

    return allFiles;
  } catch (e: any) {
    console.error('Error fetching drive files:', e);
    throw e;
  }
};

export const deleteDriveFile = async (accessToken: string, fileId: string): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Drive: ${res.statusText}`);
  }
};

export const listFilesInFolder = async (
  accessToken: string,
  folderId: string
): Promise<GoogleDriveFile[]> => {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webViewLink,modifiedTime,size)&pageSize=1000&orderBy=name`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch folder contents: ${res.statusText}`);
  }
  const data = await res.json();
  return data.files || [];
};

export const createDriveFolder = async (
  accessToken: string,
  name: string,
  parentFolderId?: string
): Promise<GoogleDriveFile> => {
  const metadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create folder in Drive: ${res.statusText}`);
  }
  return await res.json();
};

export const uploadFileToDrive = async (
  accessToken: string,
  name: string,
  content: string | Blob | ArrayBuffer | File,
  mimeType = 'text/plain',
  folderId?: string
): Promise<GoogleDriveFile> => {
  const metadata: any = {
    name,
    mimeType
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );

  if (content instanceof File || content instanceof Blob) {
    form.append('file', content, name);
  } else {
    form.append('file', new Blob([content], { type: mimeType }), name);
  }

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: form
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload file to Drive: ${res.statusText}`);
  }
  return await res.json();
};

export const batchUploadFilesToDrive = async (
  accessToken: string,
  files: Array<{ name: string; content: string | Blob | ArrayBuffer | File; mimeType?: string }>,
  folderId?: string,
  onProgress?: (completed: number, total: number, currentFileName: string) => void
): Promise<GoogleDriveFile[]> => {
  const uploadedFiles: GoogleDriveFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    if (onProgress) {
      onProgress(i, files.length, item.name);
    }
    const uploaded = await uploadFileToDrive(
      accessToken,
      item.name,
      item.content,
      item.mimeType || 'application/octet-stream',
      folderId
    );
    uploadedFiles.push(uploaded);
  }
  if (onProgress) {
    onProgress(files.length, files.length, 'Completed');
  }
  return uploadedFiles;
};

export const createGoogleSheet = async (
  accessToken: string,
  title: string,
  values: string[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: values.map((row) => ({
                values: row.map((cell) => ({
                  userEnteredValue: { stringValue: cell }
                }))
              }))
            }
          ]
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Sheet: ${res.statusText}`);
  }
  const data = await res.json();
  return { spreadsheetId: data.spreadsheetId, spreadsheetUrl: data.spreadsheetUrl };
};

export const createGoogleDoc = async (
  accessToken: string,
  title: string,
  content: string
): Promise<{ documentId: string; url: string }> => {
  const res = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ title })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Doc: ${res.statusText}`);
  }
  const doc = await res.json();

  if (content) {
    await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content
            }
          }
        ]
      })
    });
  }

  return {
    documentId: doc.documentId,
    url: `https://docs.google.com/document/d/${doc.documentId}/edit`
  };
};

export const createGoogleSlideDeck = async (
  accessToken: string,
  title: string,
  slideTitle: string,
  slideBody: string
): Promise<{ presentationId: string; url: string }> => {
  const res = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ title })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Slide: ${res.statusText}`);
  }
  const deck = await res.json();

  return {
    presentationId: deck.presentationId,
    url: `https://docs.google.com/presentation/d/${deck.presentationId}/edit`
  };
};

export const listCalendarEvents = async (accessToken: string): Promise<GoogleCalendarEvent[]> => {
  const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&maxResults=2500&orderBy=startTime&singleEvents=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Calendar events: ${res.statusText}`);
  }
  const data = await res.json();
  return data.items || [];
};

export const createCalendarEvent = async (
  accessToken: string,
  summary: string,
  description: string,
  startTime: string,
  endTime: string,
  attendees: string[] = []
): Promise<GoogleCalendarEvent> => {
  const body: any = {
    summary,
    description,
    start: { dateTime: startTime },
    end: { dateTime: endTime },
    attendees: attendees.filter(Boolean).map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
    {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Calendar event: ${res.statusText}`);
  }
  return await res.json();
};

export const deleteCalendarEvent = async (accessToken: string, eventId: string): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete calendar event: ${res.statusText}`);
  }
};

export const sendGmailMessage = async (
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<any> => {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText
  ];
  const message = messageParts.join('\r\n');
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ raw: encodedMessage })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send Gmail: ${res.statusText}`);
  }
  return await res.json();
};

export const generateGoogleMeetLink = async (
  accessToken: string,
  title: string
): Promise<string> => {
  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const ev = await createCalendarEvent(
    accessToken,
    `Google Meet: ${title}`,
    'Scheduled via Google Workspace Enterprise Hub',
    start.toISOString(),
    end.toISOString()
  );
  return ev.hangoutLink || ev.htmlLink || 'https://meet.google.com';
};

export const listGoogleContacts = async (accessToken: string): Promise<GoogleContact[]> => {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=1000',
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Contacts: ${res.statusText}`);
  }
  const data = await res.json();
  return data.connections || [];
};

export const createGoogleContact = async (
  accessToken: string,
  givenName: string,
  familyName: string,
  email: string,
  phone: string
): Promise<any> => {
  const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      names: [{ givenName, familyName }],
      emailAddresses: [{ value: email }],
      phoneNumbers: [{ value: phone }]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Contact: ${res.statusText}`);
  }
  return await res.json();
};

export const listGoogleTasks = async (accessToken: string): Promise<GoogleTask[]> => {
  const res = await fetch(
    'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=true&maxResults=100',
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Tasks: ${res.statusText}`);
  }
  const data = await res.json();
  return data.items || [];
};

export const createGoogleTask = async (
  accessToken: string,
  title: string,
  notes: string,
  due?: string
): Promise<GoogleTask> => {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      title,
      notes,
      due: due ? new Date(due).toISOString() : undefined
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Task: ${res.statusText}`);
  }
  return await res.json();
};

export const updateGoogleTaskStatus = async (
  accessToken: string,
  taskId: string,
  completed: boolean
): Promise<GoogleTask> => {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      status: completed ? 'completed' : 'needsAction'
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update Task status: ${res.statusText}`);
  }
  return await res.json();
};

export const deleteGoogleTask = async (accessToken: string, taskId: string): Promise<void> => {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete task: ${res.statusText}`);
  }
};

export const sendGoogleChatMessage = async (
  accessToken: string,
  spaceName: string,
  text: string
): Promise<any> => {
  const cleanSpace = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
  const res = await fetch(`https://chat.googleapis.com/v1/${cleanSpace}/messages`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send Chat message: ${res.statusText}`);
  }
  return await res.json();
};

// ==========================================
// 1. Google Forms API Functions
// ==========================================

export const createGoogleForm = async (
  accessToken: string,
  title: string,
  description?: string,
  initialQuestions?: {
    title: string;
    type: 'RADIO' | 'CHECKBOX' | 'TEXT' | 'PARAGRAPH';
    options?: string[];
    required?: boolean;
  }[]
): Promise<GoogleForm> => {
  // Step 1: Create empty form
  const res = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      info: {
        title,
        documentTitle: title,
        description: description || 'Clinical intake and assessment form'
      }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Form: ${res.statusText}`);
  }

  const createdForm: GoogleForm = await res.json();

  // Step 2: Add initial questions if provided
  if (initialQuestions && initialQuestions.length > 0) {
    const requests = initialQuestions.map((q, index) => {
      let questionItem: any = {};
      if (q.type === 'RADIO' || q.type === 'CHECKBOX') {
        questionItem = {
          question: {
            required: !!q.required,
            choiceQuestion: {
              type: q.type,
              options: (q.options || ['Yes', 'No', 'Unsure']).map((opt) => ({ value: opt }))
            }
          }
        };
      } else {
        questionItem = {
          question: {
            required: !!q.required,
            textQuestion: {
              paragraph: q.type === 'PARAGRAPH'
            }
          }
        };
      }

      return {
        createItem: {
          item: {
            title: q.title,
            questionItem
          },
          location: { index }
        }
      };
    });

    await fetch(`https://forms.googleapis.com/v1/forms/${createdForm.formId}:batchUpdate`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify({ requests })
    }).catch((e) => console.warn('Could not add initial questions to form:', e));
  }

  return createdForm;
};

export const getGoogleForm = async (accessToken: string, formId: string): Promise<GoogleForm> => {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Form: ${res.statusText}`);
  }
  return await res.json();
};

export const listGoogleFormResponses = async (
  accessToken: string,
  formId: string
): Promise<GoogleFormResponse[]> => {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Form responses: ${res.statusText}`);
  }
  const data = await res.json();
  return data.responses || [];
};

// ==========================================
// 2. Google Meet API (v2 REST Spaces)
// ==========================================

export const createGoogleMeetSpace = async (
  accessToken: string,
  config?: { accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED' }
): Promise<GoogleMeetSpace> => {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      config: {
        accessType: config?.accessType || 'OPEN'
      }
    })
  });

  if (!res.ok) {
    // If Meet API v2 is not enabled or returns an error, fallback to Calendar meet conference
    console.warn('Direct Meet API v2 failed, falling back to Calendar-backed Meet link');
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const calEvent = await createCalendarEvent(
      accessToken,
      'NDIS Clinical Consultation Room',
      'Created via Google Workspace Meet Integration',
      start.toISOString(),
      end.toISOString()
    );
    const meetingUri = calEvent.hangoutLink || calEvent.htmlLink || 'https://meet.google.com';
    return {
      name: `spaces/${calEvent.id}`,
      meetingUri,
      meetingCode: meetingUri.replace('https://meet.google.com/', ''),
      config: { accessType: 'OPEN' }
    };
  }

  return await res.json();
};

export const getGoogleMeetSpace = async (
  accessToken: string,
  spaceName: string
): Promise<GoogleMeetSpace> => {
  const cleanName = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
  const res = await fetch(`https://meet.googleapis.com/v2/${cleanName}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Meet space: ${res.statusText}`);
  }
  return await res.json();
};

// ==========================================
// 3. Google Picker API Client Loader
// ==========================================

let isGoogleApiLoaded = false;
let isPickerApiLoaded = false;

export const loadGooglePickerScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if (isPickerApiLoaded && (window as any).google?.picker) return resolve();

    const existingScript = document.getElementById('google-picker-api-script');
    if (existingScript) {
      if ((window as any).gapi) {
        (window as any).gapi.load('picker', {
          callback: () => {
            isPickerApiLoaded = true;
            resolve();
          },
          onerror: () => reject(new Error('Failed to load Google Picker'))
        });
      } else {
        existingScript.addEventListener('load', () => {
          (window as any).gapi.load('picker', {
            callback: () => {
              isPickerApiLoaded = true;
              resolve();
            },
            onerror: () => reject(new Error('Failed to load Google Picker'))
          });
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-picker-api-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isGoogleApiLoaded = true;
      (window as any).gapi.load('picker', {
        callback: () => {
          isPickerApiLoaded = true;
          resolve();
        },
        onerror: () => reject(new Error('Failed to load Google Picker'))
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google API script'));
    document.body.appendChild(script);
  });
};

export interface PickedFileResult {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
  isFolder?: boolean;
  containedFiles?: GoogleDriveFile[];
  parentFolderId?: string;
}

export interface GooglePickerOptions {
  viewType?: 'ALL' | 'FOLDERS' | 'DOCS' | 'SPREADSHEETS' | 'PRESENTATIONS' | 'FORMS' | 'PDFS';
  allowMultiSelect?: boolean;
  allowFolderSelect?: boolean;
  enableUploadTab?: boolean;
  onPickedFiles?: (
    files: PickedFileResult[],
    folderDetails?: { id: string; name: string; files: GoogleDriveFile[] } | null
  ) => void;
}

export const launchGooglePicker = async (
  accessToken: string,
  onPicked: (file: PickedFileResult) => void,
  viewTypeOrOptions:
    | 'ALL'
    | 'FOLDERS'
    | 'DOCS'
    | 'SPREADSHEETS'
    | 'PRESENTATIONS'
    | 'FORMS'
    | 'PDFS'
    | GooglePickerOptions = 'ALL'
): Promise<void> => {
  await loadGooglePickerScript();
  const google = (window as any).google;
  if (!google?.picker) {
    throw new Error('Google Picker library is not ready.');
  }

  const options: GooglePickerOptions =
    typeof viewTypeOrOptions === 'object'
      ? viewTypeOrOptions
      : {
          viewType: viewTypeOrOptions,
          allowMultiSelect: true,
          allowFolderSelect: true,
          enableUploadTab: true
        };

  const viewType = options.viewType || 'ALL';
  const allowMultiSelect = options.allowMultiSelect ?? true;
  const allowFolderSelect = options.allowFolderSelect ?? true;
  const enableUploadTab = options.enableUploadTab ?? true;

  const pickerOrigin =
    (window.location as any).ancestorOrigins && (window.location as any).ancestorOrigins.length > 0
      ? (window.location as any).ancestorOrigins[(window.location as any).ancestorOrigins.length - 1]
      : window.location.origin;

  const builder = new google.picker.PickerBuilder()
    .setOAuthToken(accessToken)
    .setOrigin(pickerOrigin);

  if (allowMultiSelect && google.picker.Feature?.MULTISELECT_ENABLED) {
    builder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
  }
  if (google.picker.Feature?.SUPPORT_DRIVES) {
    builder.enableFeature(google.picker.Feature.SUPPORT_DRIVES);
  }

  // Configure Primary View
  let view: any;
  if (viewType === 'FOLDERS') {
    view = new google.picker.DocsView(google.picker.ViewId.DOCS);
    view.setMimeTypes('application/vnd.google-apps.folder');
    view.setSelectFolderEnabled(true);
    view.setIncludeFolders(true);
  } else if (viewType === 'SPREADSHEETS') {
    view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS);
  } else if (viewType === 'FORMS') {
    view = new google.picker.DocsView(google.picker.ViewId.FORMS);
  } else if (viewType === 'PDFS') {
    view = new google.picker.DocsView(google.picker.ViewId.PDFS);
  } else if (viewType === 'PRESENTATIONS') {
    view = new google.picker.DocsView(google.picker.ViewId.PRESENTATIONS);
  } else {
    view = new google.picker.DocsView(google.picker.ViewId.DOCS);
    view.setIncludeFolders(true);
    if (allowFolderSelect) {
      view.setSelectFolderEnabled(true);
    }
  }

  builder.addView(view);

  // Add dedicated Folder View if in ALL view for quick folder selection
  if (viewType === 'ALL' && allowFolderSelect) {
    const folderView = new google.picker.DocsView(google.picker.ViewId.FOLDERS || google.picker.ViewId.DOCS);
    folderView.setMimeTypes('application/vnd.google-apps.folder');
    folderView.setSelectFolderEnabled(true);
    folderView.setIncludeFolders(true);
    builder.addView(folderView);
  }

  // Add DocsUploadView if enabled so users can also batch-upload files inside the picker directly
  if (enableUploadTab && google.picker.DocsUploadView) {
    try {
      const uploadView = new google.picker.DocsUploadView();
      uploadView.setIncludeFolders(true);
      if (uploadView.setMultiselect) {
        uploadView.setMultiselect(true);
      }
      builder.addView(uploadView);
    } catch (e) {
      // Ignore if DocsUploadView is restricted in iframe
    }
  }

  builder.setCallback(async (data: any) => {
    if (data.action === google.picker.Action.PICKED) {
      const rawDocs = data.docs || [];
      if (rawDocs.length === 0) return;

      const processedFiles: PickedFileResult[] = [];
      let selectedFolderDetails: { id: string; name: string; files: GoogleDriveFile[] } | null = null;

      for (const doc of rawDocs) {
        const isFolder =
          doc.mimeType === 'application/vnd.google-apps.folder' || doc.type === 'folder';

        let containedFiles: GoogleDriveFile[] | undefined = undefined;
        if (isFolder) {
          try {
            containedFiles = await listFilesInFolder(accessToken, doc.id);
            selectedFolderDetails = {
              id: doc.id,
              name: doc.name,
              files: containedFiles
            };
          } catch (err) {
            console.warn('Could not auto-list files in picked folder:', err);
          }
        }

        const pickedItem: PickedFileResult = {
          id: doc.id,
          name: doc.name,
          url: doc.url || `https://docs.google.com/open?id=${doc.id}`,
          mimeType: doc.mimeType || (isFolder ? 'application/vnd.google-apps.folder' : 'application/octet-stream'),
          sizeBytes: doc.sizeBytes,
          isFolder,
          containedFiles
        };
        processedFiles.push(pickedItem);
      }

      // First call single-item callback for backwards compatibility with the primary/first item
      if (processedFiles.length > 0) {
        onPicked(processedFiles[0]);
      }

      // Call rich multi-file / folder callback if provided in options
      if (options.onPickedFiles) {
        options.onPickedFiles(processedFiles, selectedFolderDetails);
      }
    }
  });

  const picker = builder.build();
  picker.setVisible(true);
};

// ==========================================
// 4. Google Keep API Helper Functions
// ==========================================

export const listGoogleKeepNotes = async (accessToken: string): Promise<GoogleKeepNote[]> => {
  const res = await fetch('https://keep.googleapis.com/v1/notes', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Keep notes: ${res.statusText}`);
  }
  const data = await res.json();
  return data.notes || [];
};

export const createGoogleKeepNote = async (
  accessToken: string,
  title: string,
  text?: string,
  checklist?: { text: string; checked: boolean }[]
): Promise<GoogleKeepNote> => {
  const body: any = { title };
  if (checklist && checklist.length > 0) {
    body.body = {
      list: {
        listItems: checklist.map((item) => ({
          text: { text: item.text },
          checked: item.checked
        }))
      }
    };
  } else if (text) {
    body.body = {
      text: { text }
    };
  }

  const res = await fetch('https://keep.googleapis.com/v1/notes', {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Keep note: ${res.statusText}`);
  }
  return await res.json();
};

export const deleteGoogleKeepNote = async (accessToken: string, noteName: string): Promise<void> => {
  const cleanName = noteName.startsWith('notes/') ? noteName : `notes/${noteName}`;
  const res = await fetch(`https://keep.googleapis.com/v1/${cleanName}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete Keep note: ${res.statusText}`);
  }
};
