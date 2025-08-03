/**
 * Tests for tool handlers
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  state,
  ensureBrowser,
  handleNavigate,
  handleScreenshot,
  handleClick,
  handleType,
  handleGetContent
} from '../handlers';
import { MCPError, ErrorCode } from '../types';
import { withTimeout } from '../../utils';

// Mock puppeteer
jest.mock('puppeteer');
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  withTimeout: jest.fn((fn, timeout, message) => fn()),
  withRetry: jest.fn((fn) => fn()),
  successResponse: jest.fn((data, message) => ({ data, message }))
}));

describe('Handlers', () => {
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;

  beforeEach(() => {
    // Reset state
    state.browser = undefined;
    state.page = undefined;
    state.lastActivity = Date.now();
    state.requestCount = 0;

    // Setup mocks
    mockPage = {
      setViewport: jest.fn(),
      setDefaultTimeout: jest.fn(),
      isClosed: jest.fn().mockReturnValue(false),
      goto: jest.fn(),
      screenshot: jest.fn(),
      waitForSelector: jest.fn(),
      click: jest.fn(),
      type: jest.fn(),
      content: jest.fn().mockResolvedValue('<html></html>')
    } as any;

    mockBrowser = {
      isConnected: jest.fn().mockReturnValue(true),
      newPage: jest.fn().mockResolvedValue(mockPage)
    } as any;

    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureBrowser', () => {
    it('should launch browser if not initialized', async () => {
      const result = await ensureBrowser();

      expect(puppeteer.launch).toHaveBeenCalledWith({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 1280,
        height: 800
      });
      expect(mockPage.setDefaultTimeout).toHaveBeenCalledWith(30000);
      expect(result.browser).toBe(mockBrowser);
      expect(result.page).toBe(mockPage);
    });

    it('should reuse existing browser if connected', async () => {
      state.browser = mockBrowser;
      state.page = mockPage;

      const result = await ensureBrowser();

      expect(puppeteer.launch).not.toHaveBeenCalled();
      expect(result.browser).toBe(mockBrowser);
      expect(result.page).toBe(mockPage);
    });

    it('should create new page if closed', async () => {
      state.browser = mockBrowser;
      state.page = mockPage;
      mockPage.isClosed.mockReturnValue(true);

      await ensureBrowser();

      expect(mockBrowser.newPage).toHaveBeenCalled();
    });

    it('should throw MCPError on failure', async () => {
      (puppeteer.launch as jest.Mock).mockRejectedValue(new Error('Launch failed'));

      await expect(ensureBrowser()).rejects.toThrow(MCPError);
      await expect(ensureBrowser()).rejects.toMatchObject({
        code: ErrorCode.BROWSER_NOT_INITIALIZED
      });
    });
  });

  describe('handleNavigate', () => {
    it('should navigate to URL successfully', async () => {
      const params = { url: 'https://example.com' };

      const result = await handleNavigate(params);

      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'networkidle2'
      });
      expect(result).toEqual({
        data: null,
        message: 'Navigated to https://example.com'
      });
    });

    it('should handle navigation timeout', async () => {
      const params = { url: 'https://slow-site.com' };
      mockPage.goto.mockRejectedValue(new Error('Timeout'));

      await expect(handleNavigate(params)).rejects.toThrow();
    });
  });

  describe('handleScreenshot', () => {
    it('should take screenshot with correct path', async () => {
      const params = { path: 'screenshot.png', fullPage: false };

      const result = await handleScreenshot(params);

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: 'screenshot.png',
        fullPage: false
      });
      expect(result).toEqual({
        data: { path: 'screenshot.png' },
        message: 'Screenshot saved to screenshot.png'
      });
    });

    it('should add .png extension if missing', async () => {
      const params = { path: 'screenshot', fullPage: true };

      await handleScreenshot(params);

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: 'screenshot.png',
        fullPage: true
      });
    });

    it('should preserve existing image extensions', async () => {
      const params = { path: 'screenshot.jpg' };

      await handleScreenshot(params);

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: 'screenshot.jpg',
        fullPage: undefined
      });
    });
  });

  describe('handleClick', () => {
    it('should click element successfully', async () => {
      const params = { selector: '#button' };

      const result = await handleClick(params);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith('#button', {
        visible: true
      });
      expect(mockPage.click).toHaveBeenCalledWith('#button');
      expect(result).toEqual({
        data: null,
        message: 'Clicked on element: #button'
      });
    });

    it('should handle element not found', async () => {
      const params = { selector: '#missing' };
      mockPage.waitForSelector.mockRejectedValue(new Error('Element not found'));

      await expect(handleClick(params)).rejects.toThrow();
    });
  });

  describe('handleType', () => {
    it('should type text successfully', async () => {
      const params = { selector: '#input', text: 'Hello World' };

      const result = await handleType(params);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith('#input', {
        visible: true
      });
      expect(mockPage.type).toHaveBeenCalledWith('#input', 'Hello World');
      expect(result).toEqual({
        data: null,
        message: 'Typed text into element: #input'
      });
    });

    it('should handle typing errors', async () => {
      const params = { selector: '#input', text: 'test' };
      mockPage.type.mockRejectedValue(new Error('Cannot type'));

      await expect(handleType(params)).rejects.toThrow();
    });
  });

  describe('handleGetContent', () => {
    it('should get page content', async () => {
      const expectedContent = '<html><body>Test</body></html>';
      mockPage.content.mockResolvedValue(expectedContent);

      const result = await handleGetContent();

      expect(mockPage.content).toHaveBeenCalled();
      expect(result).toEqual({
        data: expectedContent,
        message: undefined
      });
    });

    it('should handle content errors', async () => {
      mockPage.content.mockRejectedValue(new Error('Failed to get content'));

      await expect(handleGetContent()).rejects.toThrow();
    });
  });
});