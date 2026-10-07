import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';

import {
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  ErrorOutline as ErrorOutlineIcon,
  LockOutlined as LockOutlinedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@material-ui/icons';

import Loading from './Loading';

const RATE_LIMIT = {
  WARNING: 5,
  COOLDOWN_5: [6, 10],
  COOLDOWN_10: [11, 49],
  BLOCK_5_MIN: [50, 99],
  BLOCK_15_MIN: [100, 149],
  BLOCK_60_MIN: [150, Infinity],
};

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    backgroundColor: '#f7f8fa',
    display: 'flex',
    flexDirection: 'column',
  },

  content: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3, 2),
  },

  loginContainer: {
    width: '100%',
    maxWidth: 460,
  },

  branding: {
    textAlign: 'center',
    marginBottom: theme.spacing(3),
  },

  logo: {
    width: 150,
    maxWidth: '100%',
    height: 'auto',
    objectFit: 'contain',
  },

  appName: {
    marginTop: theme.spacing(1),
    fontWeight: 600,
  },

  paper: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },

  formContent: {
    padding: theme.spacing(4),
  },

  title: {
    fontWeight: 700,
    marginBottom: theme.spacing(1),
  },

  subtitle: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
  },

  field: {
    marginBottom: theme.spacing(2),
  },

  loginButton: {
    marginTop: theme.spacing(2),
    minHeight: 48,
    textTransform: 'none',
    fontSize: 16,
    fontWeight: 600,
  },

  registerSection: {
    padding: theme.spacing(2, 4),
    borderTop: `1px solid ${theme.palette.divider}`,
    textAlign: 'center',
  },

  link: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    fontWeight: 600,

    '&:hover': {
      textDecoration: 'underline',
    },
  },

  forgotLink: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    fontWeight: 500,

    '&:hover': {
      textDecoration: 'underline',
    },
  },

  footer: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },

  dialogPaper: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 14,
  },

  dialogContent: {
    position: 'relative',
    textAlign: 'center',
    padding: theme.spacing(4),
  },

  closeButton: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    color: theme.palette.grey[500],
  },

  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: `0 auto ${theme.spacing(2)}px`,
  },

  warningIcon: {
    backgroundColor: '#FFF4E5',
    color: '#ED6C02',
  },

  cooldownIcon: {
    backgroundColor: '#E8F1FF',
    color: theme.palette.primary.main,
  },

  blockIcon: {
    backgroundColor: '#FDECEC',
    color: theme.palette.error.main,
  },

  dialogTitle: {
    fontWeight: 700,
    marginBottom: theme.spacing(1),
  },

  dialogMessage: {
    color: theme.palette.text.secondary,
    lineHeight: 1.6,
  },

  timerBox: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    borderRadius: 8,
    backgroundColor: theme.palette.grey[100],
  },

  timerLabel: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },

  timerValue: {
    fontWeight: 700,
    fontSize: 28,
    letterSpacing: 2,
  },

  dialogButton: {
    minHeight: 44,
    textTransform: 'none',
    fontWeight: 600,
  },

  loadingButtonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
  },
}));

function App() {
  const classes = useStyles();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLogin, setKeepLogin] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [validationEmail, setValidationEmail] = useState(false);
  const [validationPassword, setValidationPassword] = useState(false);

  const [passwordShown, setPasswordShown] = useState(false);

  const [failedLoginCount, setFailedLoginCount] = useState(0);

  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);
  const [retryAfter, setRetryAfter] = useState(0);

  const [warningVisible, setWarningVisible] = useState(false);
  const [cooldownVisible, setCooldownVisible] = useState(false);
  const [blockVisible, setBlockVisible] = useState(false);

  const logo =
    window.APP_LOGO || `${process.env.PUBLIC_URL}/logo.png`;

  const appName =
    window.APP_NAME || 'Geschool';

  const resetFailedLoginCounter = () => {
    setFailedLoginCount(0);
    localStorage.setItem('failedLoginCount', '0');
  };


  const getLockDuration = (attempt) => {
    if (attempt >= RATE_LIMIT.BLOCK_60_MIN[0]) {
      return 60 * 60;
    }

    if (attempt >= RATE_LIMIT.BLOCK_15_MIN[0]) {
      return 15 * 60;
    }

    if (attempt >= RATE_LIMIT.BLOCK_5_MIN[0]) {
      return 5 * 60;
    }

    if (attempt >= RATE_LIMIT.COOLDOWN_10[0]) {
      return 10;
    }

    if (attempt >= RATE_LIMIT.COOLDOWN_5[0]) {
      return 5;
    }

    return 0;
  };

  const setLockFromAttempt = (attempt) => {
    const seconds = getLockDuration(attempt);

    if (seconds <= 0) return;

    const end = Date.now() + seconds * 1000;

    setLockUntil(end);
    setIsLocked(true);
    setRetryAfter(seconds);

    localStorage.setItem('loginLockUntil', String(end));

    if (attempt >= RATE_LIMIT.BLOCK_5_MIN[0]) {
      setBlockVisible(true);
      setCooldownVisible(false);
    } else {
      setCooldownVisible(true);
      setBlockVisible(false);
    }
  };

  useEffect(() => {
    const savedCount = Number(
      localStorage.getItem('failedLoginCount') || 0
    );

    const savedLockUntil = Number(
      localStorage.getItem('loginLockUntil') || 0
    );

    setFailedLoginCount(savedCount);

    if (savedLockUntil > Date.now()) {
      setLockUntil(savedLockUntil);
      setIsLocked(true);

      setRetryAfter(
        Math.ceil((savedLockUntil - Date.now()) / 1000)
      );

      if (savedCount >= RATE_LIMIT.BLOCK_5_MIN[0]) {
        setBlockVisible(true);
        setCooldownVisible(false);
      } else {
        setCooldownVisible(true);
        setBlockVisible(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isLocked || !lockUntil) return undefined;

    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((lockUntil - Date.now()) / 1000)
      );

      setRetryAfter(remaining);

      if (remaining <= 0) {
        clearInterval(timer);

        setIsLocked(false);
        setLockUntil(null);

        setCooldownVisible(false);
        setBlockVisible(false);

        setRetryAfter(0);

        localStorage.removeItem('loginLockUntil');

        resetFailedLoginCounter();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockUntil]);


  const handleFailedLogin = (attempt, errorCode) => {
    const count = Number(attempt || 0);

    setFailedLoginCount(count);
    localStorage.setItem(
      'failedLoginCount',
      String(count)
    );

    setError({
      code: errorCode,
    });

    setLoading(false);

    if (count < RATE_LIMIT.WARNING) {
      setWarningVisible(false);
      setCooldownVisible(false);
      setBlockVisible(false);
      return;
    }


    if (count === RATE_LIMIT.WARNING) {
      setWarningVisible(true);
      setCooldownVisible(false);
      setBlockVisible(false);
      return;
    }


    setWarningVisible(false);
    setLockFromAttempt(count);
  };

  const doValidation = () => {
    if (isLocked || loading) return;

    setValidationEmail(false);
    setValidationPassword(false);
    setError(null);

    const cleanEmail = email.trim();

    let hasError = false;

    if (!cleanEmail) {
      setValidationEmail(true);
      hasError = true;
    }

    if (!password) {
      setValidationPassword(true);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    doLogin();
  };

  const doLogin = async () => {
    if (isLocked || loading) return;

    try {
      setLoading(true);

      setValidationEmail(false);
      setValidationPassword(false);
      setError(null);

      const payload = {
        email: email.trim(),
        password,
        keepLogin,
      };

      const response = await fetch('/_api/main/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      console.log('result:', result);


      if (result.success) {
        resetFailedLoginCounter();
        localStorage.removeItem('loginLockUntil');

        window.location.href = result.redirect_uri;
        return;
      }

      if (result.rate_limited) {
        const attempt = Number(
          result.attempt || failedLoginCount + 1
        );

        const errorCode =
          result.error?.code || 40002;

        handleFailedLogin(
          attempt,
          errorCode
        );

        if (result.retry_after) {
          const lockSeconds = Number(
            result.retry_after
          );

          const end =
            Date.now() + lockSeconds * 1000;

          setLockUntil(end);
          setIsLocked(true);
          setRetryAfter(lockSeconds);

          localStorage.setItem(
            'loginLockUntil',
            String(end)
          );

          if (
            attempt >=
            RATE_LIMIT.BLOCK_5_MIN[0]
          ) {
            setBlockVisible(true);
            setCooldownVisible(false);
          } else {
            setCooldownVisible(true);
            setBlockVisible(false);
          }
        }

        return;
      }

      if (result.error?.code) {
        const attempt = Number(
          result.attempt || failedLoginCount + 1
        );

        handleFailedLogin(
          attempt,
          result.error.code
        );

        return;
      }

      setError({
        code: 'GENERAL_ERROR',
      });
    } catch (err) {
      console.error('Login error:', err);

      setError({
        code: 'NETWORK_ERROR',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    doValidation();
  };


  const formatCountdown = (seconds) => {
    const safeSeconds = Math.max(
      0,
      Number(seconds) || 0
    );

    const hours = Math.floor(
      safeSeconds / 3600
    );

    const minutes = Math.floor(
      (safeSeconds % 3600) / 60
    );

    const secs =
      safeSeconds % 60;

    if (hours > 0) {
      return [
        hours,
        minutes,
        secs,
      ]
        .map((item) =>
          String(item).padStart(2, '0')
        )
        .join(':');
    }

    return [minutes, secs]
      .map((item) =>
        String(item).padStart(2, '0')
      )
      .join(':');
  };

  const emailError =
    validationEmail ||
    error?.code === 40001;

  const passwordError =
    validationPassword ||
    error?.code === 40002;

  const getEmailHelperText = () => {
    if (validationEmail) {
      return 'Email wajib diisi';
    }

    if (error?.code === 40001) {
      return 'Email tidak ditemukan';
    }

    return '';
  };

  return (
    <Box className={classes.root}>
      <Box className={classes.content}>
        <Grid
          container
          justifyContent="center"
          justify="center"
        >
          <Grid
            item
            xs={12}
            sm={8}
            md={6}
            lg={4}
          >
            <Box className={classes.loginContainer}>
              {/* Branding */}
              <Box className={classes.branding}>
                <img
                  src={logo}
                  alt={appName}
                  className={classes.logo}
                />

                <Typography
                  variant="h6"
                  className={classes.appName}
                >
                  {appName}
                </Typography>
              </Box>

              {/* Login Card */}
              <Paper
                elevation={3}
                className={classes.paper}
              >
                {loading && <Loading show />}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <Box className={classes.formContent}>
                    <Typography
                      variant="h4"
                      component="h1"
                      className={classes.title}
                    >
                      Masuk
                    </Typography>

                    <Typography
                      variant="body1"
                      className={classes.subtitle}
                    >
                      Silakan masuk untuk mulai menggunakan aplikasi.
                    </Typography>

                    {/* Email */}
                    <TextField
                      className={classes.field}
                      label="Email"
                      type="email"
                      variant="outlined"
                      value={email}
                      onChange={(event) => {
                        setEmail(
                          event.target.value
                        );

                        if (validationEmail) {
                          setValidationEmail(false);
                        }

                        if (
                          error?.code === 40001
                        ) {
                          setError(null);
                        }
                      }}
                      error={emailError}
                      helperText={getEmailHelperText()}
                      disabled={
                        loading || isLocked
                      }
                      autoComplete="email"
                      fullWidth
                    />

                    {/* Password */}
                    <TextField
                      className={classes.field}
                      label="Password"
                      variant="outlined"
                      type={
                        passwordShown
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(event) => {
                        setPassword(
                          event.target.value
                        );

                        if (
                          validationPassword
                        ) {
                          setValidationPassword(
                            false
                          );
                        }

                        if (
                          error?.code === 40002
                        ) {
                          setError(null);
                        }
                      }}
                      error={passwordError}
                      helperText={
                        validationPassword ? (
                          'Password wajib diisi'
                        ) : error?.code ===
                          40002 ? (
                          <>
                            Password tidak sesuai.{' '}
                            <a
                              href="/forgot"
                              className={
                                classes.forgotLink
                              }
                            >
                              Lupa Password?
                            </a>
                          </>
                        ) : error?.code ===
                          'NETWORK_ERROR' ? (
                          'Tidak dapat terhubung ke server.'
                        ) : error?.code ===
                          'GENERAL_ERROR' ? (
                          'Terjadi kesalahan. Silakan coba kembali.'
                        ) : (
                          ''
                        )
                      }
                      disabled={
                        loading || isLocked
                      }
                      autoComplete="current-password"
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              aria-label={
                                passwordShown
                                  ? 'Sembunyikan password'
                                  : 'Tampilkan password'
                              }
                              onClick={() =>
                                setPasswordShown(
                                  (current) =>
                                    !current
                                )
                              }
                              disabled={
                                loading ||
                                isLocked
                              }
                            >
                              {passwordShown ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Remember Me */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={keepLogin}
                          onChange={(event) =>
                            setKeepLogin(
                              event.target.checked
                            )
                          }
                          color="primary"
                          disabled={
                            loading ||
                            isLocked
                          }
                        />
                      }
                      label="Ingat saya di perangkat ini"
                    />

                    {/* Login */}
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      disableElevation
                      disabled={
                        loading || isLocked
                      }
                      className={
                        classes.loginButton
                      }
                    >
                      {loading ? (
                        <Box
                          className={
                            classes.loadingButtonContent
                          }
                        >
                          <CircularProgress
                            size={20}
                            color="inherit"
                          />

                          <span>
                            Memproses...
                          </span>
                        </Box>
                      ) : isLocked ? (
                        `Tunggu ${formatCountdown(
                          retryAfter
                        )}`
                      ) : (
                        'Masuk'
                      )}
                    </Button>
                  </Box>

                  {/* Register */}
                  <Box
                    className={
                      classes.registerSection
                    }
                  >
                    <Typography variant="body2">
                      Belum punya akun?{' '}
                      <Link
                        to="./register/"
                        className={classes.link}
                      >
                        Daftar di sini
                      </Link>
                    </Typography>
                  </Box>
                </form>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Footer */}
      <Box className={classes.footer}>
        <Typography variant="caption">
          © {new Date().getFullYear()} {appName} -
          Didukung oleh Geschool
        </Typography>
      </Box>

      <Dialog
        open={warningVisible}
        onClose={() =>
          setWarningVisible(false)
        }
        PaperProps={{
          className: classes.dialogPaper,
        }}
      >
        <DialogContent
          className={classes.dialogContent}
        >
          <IconButton
            className={classes.closeButton}
            onClick={() =>
              setWarningVisible(false)
            }
          >
            <CloseIcon />
          </IconButton>

          <Box
            className={`${classes.iconWrapper} ${classes.warningIcon}`}
          >
            <ErrorOutlineIcon
              fontSize="large"
            />
          </Box>

          <Typography
            variant="h6"
            className={classes.dialogTitle}
          >
            Terlalu banyak percobaan login
          </Typography>

          <Typography
            variant="body2"
            className={classes.dialogMessage}
          >
            Email atau password salah beberapa
            kali. Jika percobaan terus berulang,
            sistem akan mengaktifkan cooldown
            sementara.
          </Typography>

          <Box mt={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disableElevation
              className={
                classes.dialogButton
              }
              onClick={() =>
                setWarningVisible(false)
              }
            >
              Tutup
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cooldownVisible}
        disableBackdropClick
        disableEscapeKeyDown
        PaperProps={{
          className: classes.dialogPaper,
        }}
      >
        <DialogContent
          className={classes.dialogContent}
        >
          <Box
            className={`${classes.iconWrapper} ${classes.cooldownIcon}`}
          >
            <AccessTimeIcon
              fontSize="large"
            />
          </Box>

          <Typography
            variant="h6"
            className={classes.dialogTitle}
          >
            Terlalu banyak percobaan login
          </Typography>

          <Typography
            variant="body2"
            className={classes.dialogMessage}
          >
            Silakan tunggu beberapa detik sebelum
            mencoba masuk kembali.
          </Typography>

          <Paper
            elevation={0}
            className={classes.timerBox}
          >
            <Typography
              variant="body2"
              className={classes.timerLabel}
            >
              Cooldown
            </Typography>

            <Typography
              className={classes.timerValue}
            >
              {formatCountdown(retryAfter)}
            </Typography>
          </Paper>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            disabled
            disableElevation
            className={classes.dialogButton}
          >
            Tunggu {formatCountdown(retryAfter)}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={blockVisible}
        disableBackdropClick
        disableEscapeKeyDown
        PaperProps={{
          className: classes.dialogPaper,
        }}
      >
        <DialogContent
          className={classes.dialogContent}
        >
          <Box
            className={`${classes.iconWrapper} ${classes.blockIcon}`}
          >
            <LockOutlinedIcon
              fontSize="large"
            />
          </Box>

          <Typography
            variant="h6"
            className={classes.dialogTitle}
          >
            Akun Anda diblokir sementara
          </Typography>

          <Typography
            variant="body2"
            className={classes.dialogMessage}
          >
            Terlalu banyak percobaan login.
            Untuk menjaga keamanan akun, akses
            login diblokir sementara.
          </Typography>

          <Paper
            elevation={0}
            className={classes.timerBox}
          >
            <Typography
              variant="body2"
              className={classes.timerLabel}
            >
              Waktu blokir tersisa
            </Typography>

            <Typography
              className={classes.timerValue}
            >
              {formatCountdown(retryAfter)}
            </Typography>
          </Paper>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            disabled
            disableElevation
            className={classes.dialogButton}
          >
            Tunggu {formatCountdown(retryAfter)}
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default App;