# Quick Installation Guide for macOS

## Install Python Dependencies

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment:**
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies using pip3:**
   ```bash
   pip3 install -r requirements.txt
   ```
   
   **OR** use python3 -m pip:
   ```bash
   python3 -m pip install -r requirements.txt
   ```

## Install System Dependencies

If you haven't already, install Homebrew and then:

```bash
brew install ffmpeg libsndfile
```

## Run the Backend

After installing dependencies:

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run the server
uvicorn app:app --reload
```

## Common Issues

**"command not found: pip"**
- Use `pip3` instead of `pip`
- Or use `python3 -m pip` instead

**"command not found: python3"**
- Install Python 3: `brew install python3`
- Or download from https://www.python.org/downloads/

**"No module named venv"**
- Make sure you're using Python 3.9+: `python3 --version`
- Install Python 3 if needed

