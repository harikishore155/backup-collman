const KNOWLEDGE_ENDPOINTS = {
    UPLOAD: "knowledge-base/",
    GET_ALL: "knowledge-base/",
    DOWNLOAD: (id) => `knowledge-base/${id}/file`,
      
}

export default KNOWLEDGE_ENDPOINTS;