from classifier import classify_port_status, should_skip_audit_dir


def test_classify_missing_port() -> None:
    assert (
        classify_port_status(
            python_exists=False,
            latest_ts_mtime=100,
            python_mtime=0,
            write_stubs=False,
        )
        == "missing"
    )


def test_classify_created_stub() -> None:
    assert (
        classify_port_status(
            python_exists=False,
            latest_ts_mtime=100,
            python_mtime=0,
            write_stubs=True,
        )
        == "created"
    )


def test_classify_stale_port() -> None:
    assert (
        classify_port_status(
            python_exists=True,
            latest_ts_mtime=200,
            python_mtime=100,
            write_stubs=False,
        )
        == "stale"
    )


def test_classify_ok_port() -> None:
    assert (
        classify_port_status(
            python_exists=True,
            latest_ts_mtime=100,
            python_mtime=200,
            write_stubs=False,
        )
        == "ok"
    )


def test_should_skip_audit_dir() -> None:
    assert should_skip_audit_dir("node_modules") is True
    assert should_skip_audit_dir("dist") is True
    assert should_skip_audit_dir("src") is False
