import { Modal } from "react-bootstrap";
import "./CreatePractitionerModal.scss";
import Button from "../Button/Button";
import axiosInstance from "@/utils/axiosInstance";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const CreatePractitionerModal = ({ show, handleClose, setValue, defaultEmail, onSuccess }) => {


    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue: setModalValue,
        formState: { errors }
    } = useForm()

    useEffect(() => {
        if (!show) return;

        if (defaultEmail) {
            setModalValue("email", defaultEmail);
        } else {
            setModalValue("email", "");
        }
    }, [show, defaultEmail, setModalValue]);


    const onCreate = (data) => {

        setValue("emailId", data.email);
        setValue("password", data.password);

        reset();
        handleClose();
        onSuccess();
    };


    return (
        <Modal
            show={show}
            onHide={handleClose}
            centered
            backdrop="static"
            contentClassName="modal-zoom"
            className="categories-modal"
        >

            <form onSubmit={handleSubmit(onCreate)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Creation</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="modal-top">
                        <div className="input-container">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="Enter Email Id"
                                {...register("email", {
                                    required: "Email is required",
                                })}
                            />
                            {errors.email && (
                                <p className="error-message">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="input-container">
                            <label className="form-label">Password</label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-input"
                                    placeholder="Enter Password"
                                    {...register("password", {
                                        required: "Password is required",
                                    })}
                                />
                                {errors.password && (
                                    <p className="error-message">{errors.password.message}</p>
                                )}

                                <span
                                    className="input-icon"
                                    onClick={() => setShowPassword(prev => !prev)}
                                >
                                    {showPassword ? <Visibility /> : <VisibilityOff />}
                                </span>
                            </div>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="tertiary" size="lg" onClick={handleClose}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                    >
                        Create
                    </Button>
                </Modal.Footer>
            </form>

        </Modal>
    );
};

export default CreatePractitionerModal;
