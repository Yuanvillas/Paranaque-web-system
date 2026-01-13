import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';

function UploadAvatar(email, user) {

    const askBeforeUpload = () => {
        document.getElementById("avatarUpload").click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onloadend = async () => {
            const imageBase64 = reader.result;

            const confirmUpload = window.confirm("Do you want to upload a picture?");
            if (!confirmUpload) return;

            console.log("File ready to be uploaded:", imageBase64);
            console.log("Email: ", email.email);
            try {
                const res = await fetch(`https://paranaque-web-system.onrender.com/api/auth/profile/upload-image/${email.email}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ profilePicture: imageBase64 })
                });

                const data = await res.json();
                console.log("Upload response:", data);
            } catch (error) {
                console.error("Upload failed:", error);
            }
        };

        reader.readAsDataURL(file);
    };


    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <div
                onClick={askBeforeUpload}
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <FontAwesomeIcon
                    style={{ color: "#ccc", fontSize: '35px' }}
                    icon={faCamera}
                />
            </div>

            <input
                type="file"
                id="avatarUpload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </div>
    );
}

export default UploadAvatar;
