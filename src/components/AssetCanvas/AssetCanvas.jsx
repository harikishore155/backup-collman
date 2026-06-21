import "./AssetCanvas.scss";
import { useState } from "react";
import ImageUpload from "../ImageUpload/ImageUpload";
import Button from "../Button/Button";
import BackButton from "../BackButton/BackButton";

const AssetCanvas = ({ open }) => {
    const [itemImage, setItemImage] = useState(null);
    const [itemName, setItemName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [modelSerial, setModelSerial] = useState("");
    const [callDate, setCallDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [assetTag, setAssetTag] = useState("");

    if (!open) return null;

    return (
        <div className="asset-canvas-overlay">
            <div className="asset-canvas-modal">
                <div className="asset-canvas-header">
                    <BackButton />
                    <span className="title">Add Asset</span>
                </div>

                <form className="asset-canvas-form">
                    <div className="form-section">
                        <label className="form-label">ITEM IMAGE</label>
                        <div className="image-upload-box">
                            <ImageUpload
                                value={itemImage}
                                onChange={setItemImage}
                                buttonLabel="Upload"
                                buttonVariant="secondary"
                                buttonSize="lg"
                                previewShape="rect"
                                className="asset-image-upload"
                                helpText=""
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <label className="form-label">ITEM NAME *</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Enter Item Name"
                            value={itemName}
                            onChange={e => setItemName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-section">
                        <label className="form-label">AVAILABLE QUANTITY *</label>
                        <input
                            className="form-input"
                            type="number"
                            placeholder="Enter Quantity"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-section">
                        <label className="form-label">MODEL/SERIAL NUMBER *</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Enter Model/Serial Number"
                            value={modelSerial}
                            onChange={e => setModelSerial(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-section half">
                            <label className="form-label">CALL DATE</label>
                            <input
                                className="form-input"
                                type="date"
                                value={callDate}
                                onChange={e => setCallDate(e.target.value)}
                            />
                        </div>
                        <div className="form-section half">
                            <label className="form-label">DUE DATE</label>
                            <input
                                className="form-input"
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-section asset-id-section">
                        <label className="form-label asset-id-label">ASSET IDENTIFICATION *</label>
                        <input
                            className="form-input asset-id-input"
                            type="text"
                            placeholder="Type Asset Tag ID"
                            value={assetTag}
                            onChange={e => setAssetTag(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="save-asset-btn" variant="primary" size="lg">
                        Save Asset
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default AssetCanvas;