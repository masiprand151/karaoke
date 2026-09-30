import { useCallback, useEffect, useState } from "react";
import {
  FiLock,
  FiUser,
  FiLogIn,
  FiEye,
  FiEyeOff,
  FiSettings,
} from "react-icons/fi";
import useToast from "../hooks/useToast";
import useStorage from "../hooks/useStorage";
import { Button } from "bootstrap";
import api from "../utils/api";
import BaseModal from "../components/BaseModal";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setting, setSetting] = useStorage("setting");
  const [user, setUser] = useStorage("user");
  const [show, setShow] = useState(false);
  const [test, setTest] = useState(false);
  const [server, setServer] = useState(setting?.server || "http://");

  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      setLoading(true);

      try {
        const result = await api.post("/user/login", { username, password });
        setUser(result);
        toast.success("successfully logged in");
        navigate("/");
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    },
    [username, password, toast],
  );

  useEffect(() => {
    (async () => {
      try {
        const result = await api.get("/test");
        console.log(result);
      } catch (error) {
        console.log(error);
        setShow(true);
      }
    })();
  }, []);

  const handleSaveSetting = () => {
    setSetting({
      server,
    });
    setShow(false);
  };

  return (
    <>
      {!test && !setting?.server && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            padding: 16,
          }}
        >
          <button className="btn" onClick={() => setShow(true)}>
            <FiSettings size={24} />
          </button>
        </div>
      )}
      <div className="login-page min-vh-100 d-flex align-items-center justify-content-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-sm-8 col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm login-card">
                <div className="card-body p-4 p-md-5">
                  {/* Logo */}
                  <div className="text-center mb-4">
                    <div className="login-logo mx-auto mb-3">K</div>

                    <h4 className="fw-bold mb-1">Karaokepro</h4>

                    <div className="text-secondary small">
                      Silakan login untuk melanjutkan
                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                    {/* Username */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Username
                      </label>

                      <div className="input-group">
                        <span className="input-group-text bg-white">
                          <FiUser size={17} />
                        </span>

                        <input
                          type="text"
                          className="form-control"
                          placeholder="Masukkan username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          autoComplete="username"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                      <label className="form-label small fw-semibold">
                        Password
                      </label>

                      <div className="input-group">
                        <span className="input-group-text bg-white">
                          <FiLock size={17} />
                        </span>

                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          placeholder="Masukkan password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          disabled={loading}
                        />

                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <FiEyeOff size={17} />
                          ) : (
                            <FiEye size={17} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Login */}
                    <button
                      type="submit"
                      className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2 mb-2"
                      disabled={loading || (!test && !setting?.server)}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                          />

                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <FiLogIn size={17} />

                          <span>Login</span>
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2"
                      disabled={loading}
                      type="button"
                      onClick={() => window.electron.closeApp()}
                    >
                      Exit
                    </button>
                  </form>

                  <div className="text-center mt-4">
                    <small className="text-secondary">Karaokepro v1.0.0</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BaseModal
        show={(!test && !setting?.server) || show}
        title={"settings"}
        onClose={() => setShow(false)}
      >
        <div className="mb-3">
          <label className="form-label">SERVER</label>
          <input
            className="form-control"
            type="url"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <button className="btn btn-primary w-100" onClick={handleSaveSetting}>
            Save
          </button>
        </div>
      </BaseModal>
    </>
  );
}

export default Login;
