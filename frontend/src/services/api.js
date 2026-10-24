import "../components/components.css";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handleResponse(response) {
    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("The backend returned an invalid response.");
    }

    if (!response.ok) {
        const detail = data?.detail;

        const message =
            typeof detail === "string"
                ? detail
                : Array.isArray(detail)
                    ? detail.map((item) => item.msg || "Invalid input").join(", ")
                    : "Something went wrong. Please try again.";

        throw new Error(message);
    }

    return data;
}

export async function uploadDocument(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
        `${API_BASE_URL}/api/documents/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    return handleResponse(response);
}

export async function askQuestion(question) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            question: question.trim(),
        }),
    });

    return handleResponse(response);
}