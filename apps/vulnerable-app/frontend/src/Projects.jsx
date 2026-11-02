import { useEffect, useState } from "react";
import { apiRequest } from "./api";

export default function Projects({ token }) {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadProjects() {
    try {
      const data = await apiRequest("/projects", {}, token);
      setProjects(data.projects ?? data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadDocuments(project) {
    setSelectedProject(project);
    setSelectedDocument(null);
    setError("");

    try {
      const data = await apiRequest("/documents", {}, token);
      const allDocuments = data.documents ?? data;

      // The list endpoint returns only this user's organization's documents.
      setDocuments(
        allDocuments.filter(
          (document) => Number(document.project_id) === Number(project.id)
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function createProject(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest(
        "/projects",
        {
          method: "POST",
          body: JSON.stringify({
            name: projectName,
            description: projectDescription,
          }),
        },
        token
      );

      setProjectName("");
      setProjectDescription("");
      await loadProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createDocument(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest(
        "/documents",
        {
          method: "POST",
          body: JSON.stringify({
            projectId: selectedProject.id,
            title: documentTitle,
            content: documentContent,
          }),
        },
        token
      );

      setDocumentTitle("");
      setDocumentContent("");
      await loadDocuments(selectedProject);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openDocument(documentId) {
    setError("");

    try {
      const data = await apiRequest(
        `/documents/${documentId}`,
        {},
        token
      );

      setSelectedDocument(data.document ?? data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="workspace">
      <h2>Projects</h2>

      {error && <p className="error">{error}</p>}

      <form onSubmit={createProject} className="create-form">
        <h3>Create a project</h3>

        <input
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          placeholder="Project name"
          required
        />

        <textarea
          value={projectDescription}
          onChange={(event) => setProjectDescription(event.target.value)}
          placeholder="Project description"
          rows="3"
        />

        <button disabled={loading}>
          {loading ? "Creating..." : "Create project"}
        </button>
      </form>

      <div className="project-list">
        {projects.map((project) => (
          <button
            className="project-item"
            key={project.id}
            onClick={() => loadDocuments(project)}
          >
            {project.name}
            <span>Open</span>
          </button>
        ))}

        {projects.length === 0 && <p>No projects yet.</p>}
      </div>

      {selectedProject && (
        <section className="documents-section">
          <button
            className="secondary"
            onClick={() => {
              setSelectedProject(null);
              setSelectedDocument(null);
            }}
          >
            Back to projects
          </button>

          <h3>Documents in: {selectedProject.name}</h3>

          <form onSubmit={createDocument} className="create-form">
            <input
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              placeholder="Document title" //removed required to insert vulnerability
            />

            <textarea
              value={documentContent}
              onChange={(event) => setDocumentContent(event.target.value)}
              placeholder="Document content" //removed required to insert vulnerability
              rows="4"
            />

            <button disabled={loading}>
              {loading ? "Creating..." : "Create document"}
            </button>
          </form>

          <h3>Documents</h3>

          {documents.map((document) => (
            <button
              className="project-item"
              key={document.id}
              onClick={() => openDocument(document.id)}
            >
              {document.title}
              <span>View</span>
            </button>
          ))}

          {documents.length === 0 && <p>No documents in this project yet.</p>}

          {selectedDocument && (
            <article className="document-view">
              <h3>{selectedDocument.title}</h3>
              <p>{selectedDocument.content}</p>
              <small>Document ID: {selectedDocument.id}</small>
            </article>
          )}
        </section>
      )}
    </section>
  );
}