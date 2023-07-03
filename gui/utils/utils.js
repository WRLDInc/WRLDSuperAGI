import { formatDistanceToNow, parseISO } from 'date-fns';
import {baseUrl} from "@/pages/api/apiConfig";
import {EventBus} from "@/utils/eventBus";

export const formatTime = (lastExecutionTime) => {
  try {
    const parsedTime = parseISO(lastExecutionTime);
    if (isNaN(parsedTime.getTime())) {
      throw new Error('Invalid time value');
    }
    return formatDistanceToNow(parsedTime, {
      addSuffix: true,
      includeSeconds: true,
    }).replace(/about\s/, '');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

export const formatNumber = (number) => {
  if (number === null || number === undefined || number === 0) {
    return '0';
  }

  const suffixes = ['', 'k', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(number) / 3);
  const scaledNumber = number / Math.pow(10, magnitude * 3);
  const suffix = suffixes[magnitude];

  if (scaledNumber % 1 === 0) {
    return scaledNumber.toFixed(0) + suffix;
  }

  return scaledNumber.toFixed(1) + suffix;
};

export const formatTimeDifference = (updated_at, created_at) => {
  let date1 = new Date(updated_at);
  let date2 = new Date(created_at);

  let differenceInMilliseconds = date1.getTime() - date2.getTime();
  let diffInSeconds = differenceInMilliseconds / 1000;
  let diffInMinutes = diffInSeconds / 60;
  let diffInHours = diffInMinutes / 60;

  if (diffInHours >= 1) {
    return Math.round(diffInHours) + ' hr';
  } else if (diffInMinutes >=1) {
    return Math.round(diffInMinutes) + ' min';
  } else {
    return Math.round(diffInSeconds) + ' sec';
  }
}


export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));

  return `${formattedValue} ${sizes[i]}`;
}

export const downloadFile = (fileId) => {
  const authToken = localStorage.getItem('accessToken');
  const url = `${baseUrl()}/resources/get/${fileId}`;
  const env = localStorage.getItem('applicationEnvironment');

  if(env === 'PROD') {
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };

    fetch(url, { headers })
      .then((response) => response.blob())
      .then((blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        window.open(fileUrl, "_blank");
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
      });
  } else {
    window.open(url, "_blank");
  }
};

export const refreshUrl = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const urlWithoutToken = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, urlWithoutToken);
};

export const loadingTextEffect = (loadingText, setLoadingText, timer) => {
  const text = loadingText;
  let dots = '';

  const interval = setInterval(() => {
    dots = dots.length < 3 ? dots + '.' : '';
    setLoadingText(`${text}${dots}`);
  }, timer);

  return () => clearInterval(interval)
}

export const openNewTab = (id, name, contentType) => {
  EventBus.emit('openNewTab', {
    element: {id: id, name: name, contentType: contentType}
  });
}

export const removeTab = (id, name, contentType) => {
  EventBus.emit('removeTab', {
    element: {id: id, name: name, contentType: contentType}
  });
}