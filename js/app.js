// Loan Management Application
class LoanManager {
    constructor() {
        this.loans = [];
        this.init();
    }

    async initialize() {
        this.loans = await this.loadLoans();
        this.displayLoans();
        this.updateStatistics();
    }

    init() {
        // Khởi tạo Flatpickr cho date picker
        this.initDatePicker();

        // Format số tiền khi nhập
        const amountInput = document.getElementById('loanAmount');
        amountInput.addEventListener('input', (e) => {
            this.formatAmountInput(e);
        });

        // Format số tiền khi blur (rời khỏi ô input)
        amountInput.addEventListener('blur', (e) => {
            this.formatAmountInput(e);
        });

        // Form submission
        document.getElementById('loanForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addLoan();
        });

        // Load and display loans
        this.initialize();
    }

    initDatePicker() {
        const dateInput = document.getElementById('loanDate');

        // Khởi tạo Flatpickr
        flatpickr(dateInput, {
            dateFormat: "d-m-Y",
            locale: "vn",
            defaultDate: "today",
            maxDate: "today",
            allowInput: false,
            clickOpens: true,
            animate: true,
            theme: "default",
            onChange: (selectedDates, dateStr, instance) => {
                // Đảm bảo định dạng dd-mm-yyyy
                if (selectedDates.length > 0) {
                    const date = selectedDates[0];
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    dateInput.value = `${day}-${month}-${year}`;
                }
            }
        });
    }

    formatAmountInput(e) {
        let value = e.target.value;
        // Loại bỏ tất cả ký tự không phải số (bao gồm cả dấu chấm và phẩy)
        // Cho phép người dùng nhập cả dấu chấm hoặc phẩy, sau đó sẽ format lại
        value = value.replace(/[^\d]/g, '');

        if (value) {
            // Format với dấu chấm phân cách hàng nghìn (theo chuẩn Việt Nam)
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue > 0) {
                // Sử dụng format Việt Nam: dấu chấm cho hàng nghìn
                value = new Intl.NumberFormat('vi-VN').format(numValue);
            } else {
                value = '';
            }
        } else {
            value = '';
        }

        e.target.value = value;
    }

    parseAmount(amountString) {
        if (!amountString || amountString.trim() === '') {
            return 0;
        }
        // Loại bỏ tất cả dấu phân cách (dấu chấm, dấu phẩy, khoảng trắng) và chuyển thành số
        const cleaned = amountString.toString()
            .replace(/\./g, '')  // Loại bỏ dấu chấm (.)
            .replace(/,/g, '')   // Loại bỏ dấu phẩy (,)
            .replace(/\s/g, '')   // Loại bỏ khoảng trắng
            .trim();
        const parsed = parseInt(cleaned, 10);
        return isNaN(parsed) ? 0 : parsed;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    }

    formatDateInput(e) {
        let value = e.target.value;
        // Loại bỏ tất cả ký tự không phải số
        value = value.replace(/[^\d]/g, '');

        // Tự động thêm dấu gạch ngang
        if (value.length > 2 && value.length <= 4) {
            value = value.substring(0, 2) + '-' + value.substring(2);
        } else if (value.length > 4) {
            value = value.substring(0, 2) + '-' + value.substring(2, 4) + '-' + value.substring(4, 8);
        }

        e.target.value = value;
    }

    parseDate(dateString) {
        // Chuyển từ dd-mm-yyyy sang yyyy-mm-dd để lưu vào database
        if (!dateString) return '';

        const parts = dateString.split('-');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];

            // Validate ngày
            const date = new Date(`${year}-${month}-${day}`);
            if (!isNaN(date.getTime()) &&
                date.getDate() == parseInt(day) &&
                date.getMonth() + 1 == parseInt(month)) {
                return `${year}-${month}-${day}`;
            }
        }

        return dateString;
    }

    async loadLoans() {
        try {
            // Thử load từ file JSON qua API
            const response = await fetch('api/api.php');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    // Migrate dữ liệu cũ (thêm history nếu chưa có)
                    const migratedData = this.migrateOldData(data);
                    // Lưu vào localStorage làm backup
                    localStorage.setItem('loans', JSON.stringify(migratedData));
                    return migratedData;
                }
            }
        } catch (error) {
            console.log('Không thể load từ file, sử dụng localStorage:', error);
        }

        // Fallback: load từ localStorage
        const stored = localStorage.getItem('loans');
        const data = stored ? JSON.parse(stored) : [];
        return this.migrateOldData(data);
    }

    migrateOldData(data) {
        // Migrate dữ liệu cũ: thêm history, paidAmount và paymentHistory cho các bản ghi chưa có
        return data.map(loan => {
            if (!loan.history) {
                loan.history = [{
                    id: loan.id,
                    amount: loan.amount,
                    date: loan.date,
                    note: loan.note || 'Không có ghi chú'
                }];
            }
            // Khởi tạo paidAmount nếu chưa có
            if (loan.paidAmount === undefined || loan.paidAmount === null) {
                loan.paidAmount = loan.paid ? loan.amount : 0;
            }
            // Khởi tạo paymentHistory nếu chưa có
            if (!loan.paymentHistory) {
                loan.paymentHistory = [];
                // Nếu đã trả và có paidDate, thêm vào lịch sử
                if (loan.paid && loan.paidDate && loan.paidAmount > 0) {
                    loan.paymentHistory.push({
                        id: Date.now() + Math.random(),
                        amount: loan.paidAmount,
                        date: loan.paidDate,
                        note: 'Trả đủ số tiền'
                    });
                }
            }
            return loan;
        });
    }

    async saveLoans() {
        // Lưu vào localStorage ngay lập tức (backup)
        localStorage.setItem('loans', JSON.stringify(this.loans));

        // Lưu vào file JSON qua API
        try {
            const response = await fetch('api/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.loans)
            });

            if (!response.ok) {
                console.error('Lỗi khi lưu vào file JSON');
            }
        } catch (error) {
            console.error('Lỗi khi lưu vào file JSON:', error);
        }
    }

    async refreshData() {
        // Tự động reload dữ liệu từ server và cập nhật lại danh sách
        try {
            const data = await this.loadLoans();
            this.loans = data;
            this.displayLoans();
            this.updateStatistics();
        } catch (error) {
            console.error('Lỗi khi refresh dữ liệu:', error);
        }
    }

    exportToJSON() {
        const dataStr = JSON.stringify(this.loans, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `loans_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Swal.fire({
            icon: 'success',
            title: 'Đã xuất file!',
            text: 'Đã tải file JSON backup thành công!',
            confirmButtonColor: '#F38020',
            timer: 2000,
            showConfirmButton: false
        });
    }

    importFromJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (Array.isArray(importedData)) {
                        Swal.fire({
                            title: 'Xác nhận import',
                            text: `Bạn có muốn thay thế dữ liệu hiện tại bằng dữ liệu từ file? (${importedData.length} bản ghi)`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Thay thế',
                            cancelButtonText: 'Hủy',
                            confirmButtonColor: '#667eea'
                        }).then(async (result) => {
                            if (result.isConfirmed) {
                                this.loans = this.migrateOldData(importedData);
                                await this.saveLoans();
                                await this.refreshData();

                                Swal.fire({
                                    icon: 'success',
                                    title: 'Import thành công!',
                                    text: `Đã import ${importedData.length} bản ghi!`,
                                    confirmButtonColor: '#F38020',
                                    timer: 2000,
                                    showConfirmButton: false
                                });
                            }
                        });
                    } else {
                        throw new Error('Dữ liệu không hợp lệ');
                    }
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi!',
                        text: 'File JSON không hợp lệ!',
                        confirmButtonColor: '#667eea'
                    });
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    findExistingLoan(name) {
        // Tìm người mượn đã tồn tại (không phân biệt hoa thường)
        return this.loans.find(loan =>
            loan.name.toLowerCase().trim() === name.toLowerCase().trim()
        );
    }

    async addLoan() {
        const name = document.getElementById('borrowerName').value.trim();
        const amountInput = document.getElementById('loanAmount').value.trim();
        const amount = this.parseAmount(amountInput);
        const dateInput = document.getElementById('loanDate').value.trim();
        const date = this.parseDate(dateInput);
        const note = document.getElementById('loanNote').value.trim();

        // Validation
        if (!name) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Vui lòng nhập tên người mượn!',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        if (!amountInput || amount <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Vui lòng nhập số tiền hợp lệ (lớn hơn 0)!',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        if (!date || !dateInput || dateInput.length !== 10) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi!',
                text: 'Vui lòng nhập ngày cho mượn đúng định dạng (dd-mm-yyyy)!',
                confirmButtonColor: '#667eea'
            });
            return;
        }

        // Kiểm tra người mượn đã tồn tại
        const existingLoan = this.findExistingLoan(name);

        if (existingLoan) {
            // Người này đã có trong danh sách
            const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
            const formattedTotal = new Intl.NumberFormat('vi-VN').format(existingLoan.amount);
            const newTotal = existingLoan.amount + amount;
            const formattedNewTotal = new Intl.NumberFormat('vi-VN').format(newTotal);

            const result = await Swal.fire({
                title: 'Người này đã có trong danh sách!',
                html: `
                    <div class="text-left">
                        <p class="mb-2"><strong>${existingLoan.name}</strong> đã mượn: <strong>${formattedTotal} VNĐ</strong></p>
                        <p class="mb-2">Số tiền mượn thêm: <strong>${formattedAmount} VNĐ</strong></p>
                        <p class="mb-3">Tổng sau khi cộng: <strong class="text-gray-900">${formattedNewTotal} VNĐ</strong></p>
                        <p class="text-sm text-gray-600">Bạn muốn cộng dồn vào khoản nợ hiện tại hay tạo bản ghi mới?</p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Cộng dồn',
                denyButtonText: 'Tạo mới',
                cancelButtonText: 'Hủy',
                confirmButtonColor: '#10b981',
                denyButtonColor: '#3b82f6',
                cancelButtonColor: '#6b7280'
            });

            if (result.isConfirmed) {
                // Cộng dồn vào khoản nợ hiện tại
                await this.addToExistingLoan(existingLoan, amount, date, note);
                return;
            } else if (result.isDenied) {
                // Tạo bản ghi mới
                await this.createNewLoan(name, amount, date, note);
                return;
            } else {
                // Hủy
                return;
            }
        } else {
            // Người mới, tạo bản ghi mới
            await this.createNewLoan(name, amount, date, note);
        }
    }

    async addToExistingLoan(existingLoan, amount, date, note) {
        // Khởi tạo mảng lịch sử nếu chưa có
        if (!existingLoan.history) {
            existingLoan.history = [{
                id: existingLoan.id,
                amount: existingLoan.amount,
                date: existingLoan.date,
                note: existingLoan.note
            }];
        }

        // Thêm lần mượn mới vào lịch sử
        existingLoan.history.push({
            id: Date.now(),
            amount: amount,
            date: date,
            note: note || 'Không có ghi chú'
        });

        // Cập nhật tổng số tiền
        existingLoan.amount += amount;

        // Cập nhật ngày mượn mới nhất
        existingLoan.date = date;

        // Cập nhật ghi chú (nếu có)
        if (note) {
            existingLoan.note = note;
        }

        // Nếu đã trả, đặt lại về chưa trả khi mượn thêm
        if (existingLoan.paid) {
            existingLoan.paid = false;
            existingLoan.paidDate = null;
        }

        await this.saveLoans();
        await this.refreshData();

        // Reset form
        document.getElementById('loanForm').reset();
        // Reset date picker về ngày hôm nay
        const dateInput = document.getElementById('loanDate');
        if (dateInput._flatpickr) {
            dateInput._flatpickr.setDate(new Date(), false);
        } else {
            const today = new Date();
            dateInput.value = this.formatDate(today.toISOString().split('T')[0]);
        }

        Swal.fire({
            icon: 'success',
            title: 'Đã cộng dồn!',
            text: `Đã thêm ${new Intl.NumberFormat('vi-VN').format(amount)} VNĐ vào khoản nợ của ${existingLoan.name}`,
            confirmButtonColor: '#F38020',
            timer: 2000,
            showConfirmButton: false
        });
    }

    async createNewLoan(name, amount, date, note) {
        const loan = {
            id: Date.now(),
            name: name,
            amount: amount,
            date: date,
            note: note || 'Không có ghi chú',
            paid: false,
            paidDate: null,
            history: [{
                id: Date.now(),
                amount: amount,
                date: date,
                note: note || 'Không có ghi chú'
            }]
        };

        this.loans.push(loan);
        await this.saveLoans();
        await this.refreshData();

        // Reset form
        document.getElementById('loanForm').reset();
        // Reset date picker về ngày hôm nay
        const dateInput = document.getElementById('loanDate');
        if (dateInput._flatpickr) {
            dateInput._flatpickr.setDate(new Date(), false);
        } else {
            const today = new Date();
            dateInput.value = this.formatDate(today.toISOString().split('T')[0]);
        }

        Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Đã thêm người mượn tiền vào danh sách!',
            confirmButtonColor: '#F38020',
            timer: 2000,
            showConfirmButton: false
        });
    }

    deleteLoan(id) {
        Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: "Bạn không thể hoàn tác hành động này!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F38020',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                this.loans = this.loans.filter(loan => loan.id !== id);
                await this.saveLoans();
                await this.refreshData();

                Swal.fire({
                    icon: 'success',
                    title: 'Đã xóa!',
                    text: 'Đã xóa người mượn khỏi danh sách.',
                    confirmButtonColor: '#F38020',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    }

    async togglePaidStatus(id) {
        const loan = this.loans.find(l => l.id === id);
        if (!loan) return;

        // Khởi tạo paidAmount nếu chưa có
        if (!loan.paidAmount) {
            loan.paidAmount = 0;
        }

        const formattedTotal = new Intl.NumberFormat('vi-VN').format(loan.amount);
        const formattedPaid = new Intl.NumberFormat('vi-VN').format(loan.paidAmount);
        const remaining = loan.amount - loan.paidAmount;
        const formattedRemaining = new Intl.NumberFormat('vi-VN').format(remaining);

        if (loan.paid) {
            // Nếu đã trả, hỏi có muốn đặt lại về chưa trả không
            const result = await Swal.fire({
                title: 'Đặt lại trạng thái?',
                html: `
                    <div class="text-left">
                        <p class="mb-2">Tổng số tiền: <strong>${formattedTotal} VNĐ</strong></p>
                        <p class="mb-2">Đã trả: <strong class="text-gray-900">${formattedPaid} VNĐ</strong></p>
                        <p class="mb-3">Bạn có muốn đặt lại về trạng thái "Chưa trả"?</p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Đặt lại',
                cancelButtonText: 'Hủy',
                confirmButtonColor: '#6b7280',
                cancelButtonColor: '#6b7280'
            });

            if (result.isConfirmed) {
                loan.paid = false;
                loan.paidAmount = 0;
                loan.paidDate = null;
                await this.saveLoans();
                await this.refreshData();

                Swal.fire({
                    icon: 'success',
                    title: 'Đã đặt lại!',
                    text: 'Đã đặt lại về trạng thái chưa trả.',
                    confirmButtonColor: '#F38020',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } else {
            // Nếu chưa trả, hiển thị dialog nhập số tiền đã trả
            const result = await Swal.fire({
                title: 'Nhập Số Tiền Đã Trả',
                html: `
                    <div class="text-left mb-4">
                        <p class="mb-2"><strong>Tổng số tiền:</strong> <span class="text-lg font-bold text-gray-800">${formattedTotal} VNĐ</span></p>
                        <p class="mb-2"><strong>Đã trả:</strong> <span class="text-lg font-bold text-gray-900">${formattedPaid} VNĐ</span></p>
                        <p class="mb-3"><strong>Còn nợ:</strong> <span class="text-lg font-bold text-gray-900">${formattedRemaining} VNĐ</span></p>
                    </div>
                    <input id="swal-paid-amount" type="text" class="swal2-input" placeholder="Nhập số tiền đã trả (VNĐ)" value="${formattedPaid}">
                    <p class="text-xs text-gray-500 mt-2">Nhập số tiền mới đã trả (sẽ cộng dồn vào số đã trả hiện tại)</p>
                `,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Xác nhận',
                cancelButtonText: 'Hủy',
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#4C82F9',
                didOpen: () => {
                    // Format số tiền khi nhập
                    const amountInput = document.getElementById('swal-paid-amount');
                    amountInput.addEventListener('input', (e) => {
                        let value = e.target.value.replace(/[^\d]/g, '');
                        if (value) {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue) && numValue > 0) {
                                value = new Intl.NumberFormat('vi-VN').format(numValue);
                            } else {
                                value = '';
                            }
                        } else {
                            value = '';
                        }
                        e.target.value = value;
                    });
                },
                preConfirm: () => {
                    const amountInput = document.getElementById('swal-paid-amount').value;
                    return this.parseAmount(amountInput);
                }
            });

            if (result.isConfirmed && result.value !== undefined) {
                const paidAmount = result.value;

                if (paidAmount <= 0) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi!',
                        text: 'Số tiền phải lớn hơn 0!',
                        confirmButtonColor: '#667eea'
                    });
                    return;
                }

                // Khởi tạo mảng lịch sử trả tiền nếu chưa có
                if (!loan.paymentHistory) {
                    loan.paymentHistory = [];
                }

                // Thêm lần trả tiền vào lịch sử
                loan.paymentHistory.push({
                    id: Date.now(),
                    amount: paidAmount,
                    date: new Date().toISOString().split('T')[0],
                    note: `Trả ${new Intl.NumberFormat('vi-VN').format(paidAmount)} VNĐ`
                });

                // Cộng dồn số tiền đã trả
                loan.paidAmount = (loan.paidAmount || 0) + paidAmount;

                // Nếu đã trả đủ hoặc vượt quá, đánh dấu đã trả
                if (loan.paidAmount >= loan.amount) {
                    loan.paid = true;
                    loan.paidDate = new Date().toISOString().split('T')[0];
                    loan.paidAmount = loan.amount; // Đảm bảo không vượt quá
                } else {
                    loan.paid = false;
                }

                await this.saveLoans();
                await this.refreshData();

                const newRemaining = loan.amount - loan.paidAmount;
                const formattedNewPaid = new Intl.NumberFormat('vi-VN').format(loan.paidAmount);
                const formattedNewRemaining = new Intl.NumberFormat('vi-VN').format(newRemaining);

                Swal.fire({
                    icon: loan.paid ? 'success' : 'info',
                    title: loan.paid ? 'Đã trả đủ!' : 'Đã cập nhật!',
                    html: `
                        <div class="text-left">
                            <p class="mb-1">Đã trả: <strong class="text-gray-900">${formattedNewPaid} VNĐ</strong></p>
                            <p class="mb-1">Còn nợ: <strong class="text-gray-900">${formattedNewRemaining} VNĐ</strong></p>
                            ${loan.paid ? '<p class="text-gray-900 font-semibold mt-2">✓ Đã trả đủ số tiền!</p>' : ''}
                        </div>
                    `,
                    confirmButtonColor: '#F38020',
                    timer: loan.paid ? 2500 : 2000,
                    showConfirmButton: false
                });
            }
        }
    }

    async editLoan(id) {
        const loan = this.loans.find(l => l.id === id);
        if (!loan) return;

        const formattedAmount = new Intl.NumberFormat('vi-VN').format(loan.amount);
        const formattedDate = this.formatDate(loan.date);

        const result = await Swal.fire({
            title: 'Chỉnh Sửa Thông Tin',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Tên người mượn" value="${loan.name}">
                <input id="swal-amount" type="text" class="swal2-input" placeholder="Số tiền (VNĐ)" value="${formattedAmount}">
                <input id="swal-date" type="text" class="swal2-input" placeholder="dd-mm-yyyy" value="${formattedDate}" maxlength="10">
                <input id="swal-note" class="swal2-input" placeholder="Ghi chú" value="${loan.note}">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Lưu',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#F38020',
            didOpen: () => {
                // Format số tiền khi nhập trong dialog
                const amountInput = document.getElementById('swal-amount');
                amountInput.addEventListener('input', (e) => {
                    // Loại bỏ tất cả ký tự không phải số
                    let value = e.target.value.replace(/[^\d]/g, '');
                    if (value) {
                        const numValue = parseInt(value, 10);
                        if (!isNaN(numValue) && numValue > 0) {
                            value = new Intl.NumberFormat('vi-VN').format(numValue);
                        } else {
                            value = '';
                        }
                    } else {
                        value = '';
                    }
                    e.target.value = value;
                });

                // Khởi tạo Flatpickr cho date picker trong dialog
                const dateInput = document.getElementById('swal-date');
                flatpickr(dateInput, {
                    dateFormat: "d-m-Y",
                    locale: "vn",
                    allowInput: false,
                    clickOpens: true,
                    animate: true,
                    onChange: (selectedDates, dateStr, instance) => {
                        if (selectedDates.length > 0) {
                            const date = selectedDates[0];
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            dateInput.value = `${day}-${month}-${year}`;
                        }
                    }
                });
            },
            preConfirm: () => {
                return {
                    name: document.getElementById('swal-name').value.trim(),
                    amount: this.parseAmount(document.getElementById('swal-amount').value),
                    date: this.parseDate(document.getElementById('swal-date').value),
                    dateInput: document.getElementById('swal-date').value.trim(),
                    note: document.getElementById('swal-note').value.trim()
                };
            }
        });

        if (result.isConfirmed && result.value) {
            const { name, amount, date, dateInput, note } = result.value;

            if (!name || !amount || amount <= 0 || !date || !dateInput || dateInput.length !== 10) {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi!',
                    text: 'Vui lòng điền đầy đủ thông tin hợp lệ! (Ngày: dd-mm-yyyy)',
                    confirmButtonColor: '#667eea'
                });
                return;
            }

            // Kiểm tra nếu đổi tên và tên mới trùng với người khác
            if (name.toLowerCase() !== loan.name.toLowerCase()) {
                const existingLoan = this.findExistingLoan(name);
                if (existingLoan && existingLoan.id !== loan.id) {
                    const confirm = await Swal.fire({
                        title: 'Tên đã tồn tại!',
                        text: `Tên "${name}" đã được sử dụng bởi người khác. Bạn có muốn tiếp tục?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Tiếp tục',
                        cancelButtonText: 'Hủy',
                        confirmButtonColor: '#667eea'
                    });

                    if (!confirm.isConfirmed) {
                        return;
                    }
                }
            }

            loan.name = name;
            loan.amount = amount;
            loan.date = date;
            loan.note = note || 'Không có ghi chú';

            await this.saveLoans();
            await this.refreshData();

            Swal.fire({
                icon: 'success',
                title: 'Đã cập nhật!',
                confirmButtonColor: '#F38020',
                timer: 1500,
                showConfirmButton: false
            });
        }
    }

    displayLoans() {
        const listContainer = document.getElementById('loansList');
        let emptyState = document.getElementById('emptyState');

        if (this.loans.length === 0) {
            // Nếu emptyState không tồn tại, tạo lại
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.id = 'emptyState';
                emptyState.className = 'text-center text-gray-500 py-6 sm:py-8';
                emptyState.innerHTML = `
                    <i class="fas fa-inbox text-3xl sm:text-4xl mb-3 sm:mb-4" style="color: #F38020;"></i>
                    <p class="font-medium text-sm sm:text-base px-4">Chưa có người mượn tiền nào. Hãy thêm người đầu tiên!</p>
                `;
                listContainer.appendChild(emptyState);
            }
            emptyState.style.display = 'block';
            return;
        }

        // Ẩn emptyState nếu có
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        listContainer.innerHTML = this.loans.map(loan => {
            const formattedDate = this.formatDate(loan.date);
            const formattedAmount = new Intl.NumberFormat('vi-VN').format(loan.amount);
            const paidBadge = loan.paid
                ? '<span class="px-3 py-1 rounded-full text-sm font-semibold text-white" style="background-color: #8B5CF6;"><i class="fas fa-check-circle mr-1"></i>Đã trả</span>'
                : '<span class="px-3 py-1 rounded-full text-sm font-semibold text-white" style="background-color: #F38020;"><i class="fas fa-times-circle mr-1"></i>Chưa trả</span>';

            // Thông tin số tiền đã trả và còn nợ - Hiển thị trực quan
            const paidAmount = loan.paidAmount || 0;
            const remainingAmount = loan.amount - paidAmount;
            const formattedPaidAmount = new Intl.NumberFormat('vi-VN').format(paidAmount);
            const formattedRemaining = new Intl.NumberFormat('vi-VN').format(remainingAmount);
            const paidPercentage = loan.amount > 0 ? Math.round((paidAmount / loan.amount) * 100) : 0;

            let paidInfoHtml = '';
            if (paidAmount > 0 || loan.paid) {
                paidInfoHtml = `
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <!-- Card Đã Trả -->
                            <div class="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        <i class="fas fa-check-circle mr-1" style="color: #8B5CF6;"></i>Đã Trả
                                    </span>
                                    <span class="text-xs font-bold text-white px-2 py-1 rounded-full" style="background-color: #8B5CF6;">
                                        ${paidPercentage}%
                                    </span>
                                </div>
                                <div class="text-xl font-bold mt-1" style="color: #8B5CF6;">
                                    ${formattedPaidAmount}
                                </div>
                                <div class="text-xs text-gray-600 mt-1 font-medium">VNĐ</div>
                            </div>
                            
                            <!-- Card Còn Nợ -->
                            <div class="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        <i class="fas ${remainingAmount > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'} mr-1" style="color: ${remainingAmount > 0 ? '#F38020' : '#8B5CF6'};"></i>Còn Nợ
                                    </span>
                                </div>
                                <div class="text-xl font-bold mt-1" style="color: ${remainingAmount > 0 ? '#F38020' : '#8B5CF6'};">
                                    ${formattedRemaining}
                                </div>
                                <div class="text-xs text-gray-600 mt-1 font-medium">VNĐ</div>
                            </div>
                        </div>
                        
                        <!-- Progress Bar -->
                        <div class="mb-2">
                            <div class="flex justify-between text-xs text-gray-600 mb-1 font-medium">
                                <span>Tiến độ thanh toán</span>
                                <span class="font-semibold">${paidPercentage}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div class="h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-1" 
                                     style="width: ${paidPercentage}%; background-color: #8B5CF6;">
                                    ${paidPercentage > 10 ? `<span class="text-xs text-white font-bold">${paidPercentage}%</span>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${loan.paid && loan.paidDate
                        ? `<div class="text-center mt-2">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white" style="background-color: #8B5CF6;">
                                    <i class="fas fa-calendar-check mr-1"></i>Đã trả đủ vào ${this.formatDate(loan.paidDate)}
                                </span>
                               </div>`
                        : remainingAmount > 0
                            ? `<div class="text-center mt-2">
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white" style="background-color: #F38020;">
                                        <i class="fas fa-clock mr-1"></i>Đang thanh toán dần
                                    </span>
                                   </div>`
                            : ''
                    }
                    </div>
                `;
            }

            // Hiển thị lịch sử mượn nếu có nhiều hơn 1 lần
            let historyHtml = '';
            if (loan.history && loan.history.length > 1) {
                historyHtml = `
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        <button onclick="loanManager.toggleHistory(${loan.id})" 
                            class="text-sm text-gray-600 hover:text-gray-900 font-semibold mb-2 transition-colors">
                            <i class="fas fa-history mr-1" style="color: #4C82F9;"></i>
                            Xem lịch sử mượn (${loan.history.length} lần)
                            <i class="fas fa-chevron-down ml-1" id="history-icon-${loan.id}"></i>
                        </button>
                        <div id="history-${loan.id}" class="hidden mt-2 space-y-2">
                            ${loan.history.map((item, index) => `
                                <div class="bg-gray-50 rounded p-2 text-sm border border-gray-200">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <span class="font-semibold text-gray-700">Lần ${index + 1}:</span>
                                            <span class="text-gray-900 font-semibold ml-2">${new Intl.NumberFormat('vi-VN').format(item.amount)} VNĐ</span>
                                        </div>
                                        <span class="text-gray-500 text-xs font-medium">${this.formatDate(item.date)}</span>
                                    </div>
                                    ${item.note && item.note !== 'Không có ghi chú' ? `<p class="text-gray-600 text-xs mt-1"><i class="fas fa-comment mr-1" style="color: #F38020;"></i>${item.note}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            return `
                <div class="border border-gray-200 rounded-lg hover:shadow-md transition-all bg-white">
                    <!-- Header - Luôn hiển thị -->
                    <div class="p-3 sm:p-4 border-b border-gray-200">
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div class="flex items-center gap-2 sm:gap-3 flex-1 flex-wrap">
                                <button onclick="loanManager.toggleLoanDetails(${loan.id})" 
                                    class="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0">
                                    <i class="fas fa-chevron-down text-sm" id="toggle-icon-${loan.id}"></i>
                                </button>
                                <h3 class="text-lg sm:text-xl font-semibold text-gray-900 truncate">${loan.name}</h3>
                                ${paidBadge}
                                ${loan.history && loan.history.length > 1 ? `<span class="px-2 py-1 rounded-full text-xs font-semibold text-white hidden sm:inline-block" style="background-color: #4C82F9;"><i class="fas fa-layer-group mr-1"></i>${loan.history.length} lần</span>` : ''}
                                <span class="text-xs sm:text-sm text-gray-600 font-semibold">${formattedAmount} VNĐ</span>
                            </div>
                            <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <button onclick="loanManager.togglePaidStatus(${loan.id})" 
                                    class="px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md text-white hover:opacity-90"
                                    style="background-color: ${loan.paid ? '#F38020' : '#8B5CF6'};">
                                    <i class="fas ${loan.paid ? 'fa-undo' : 'fa-check'} mr-1"></i>
                                    ${loan.paid ? 'Chưa trả' : 'Đã trả'}
                                </button>
                                <button onclick="loanManager.editLoan(${loan.id})" 
                                    class="px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md text-white hover:opacity-90"
                                    style="background-color: #4C82F9;">
                                    <i class="fas fa-edit mr-1"></i>Sửa
                                </button>
                                <button onclick="loanManager.deleteLoan(${loan.id})" 
                                    class="px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md text-white hover:opacity-90"
                                    style="background-color: #ef4444;">
                                    <i class="fas fa-trash mr-1"></i>Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Chi tiết - Có thể thu gọn (Mặc định thu gọn) -->
                    <div id="loan-details-${loan.id}" class="p-3 sm:p-4 hidden">
                        <div class="flex-1">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600">
                                <!-- Card Tổng Số Tiền -->
                                <div class="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                    <div class="flex items-center mb-1">
                                        <i class="fas fa-money-bill-wave mr-2" style="color: #F38020;"></i>
                                        <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Tổng Số Tiền</span>
                                    </div>
                                    <div class="text-xl font-bold mt-1" style="color: #F38020;">
                                        ${formattedAmount}
                                    </div>
                                    <div class="text-xs text-gray-600 mt-1 font-medium">VNĐ</div>
                                </div>
                                
                                <!-- Card Ngày Mượn -->
                                <div class="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                    <div class="flex items-center mb-1">
                                        <i class="fas fa-calendar-alt mr-2" style="color: #4C82F9;"></i>
                                        <span class="text-xs font-semibold text-gray-700 uppercase tracking-wide">Ngày Mượn</span>
                                    </div>
                                    <div class="text-lg font-bold mt-1" style="color: #4C82F9;">
                                        ${formattedDate}
                                    </div>
                                    <div class="text-xs text-gray-600 mt-1">
                                        <i class="far fa-clock mr-1"></i>Gần nhất
                                    </div>
                                </div>
                                
                                <!-- Ghi Chú -->
                                <div class="sm:col-span-2">
                                    <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div class="flex items-start">
                                            <i class="fas fa-comment text-gray-600 mr-2 mt-1"></i>
                                            <div>
                                                <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Ghi Chú</span>
                                                <p class="text-gray-800">${loan.note}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                ${paidInfoHtml}
                            </div>
                            ${historyHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleHistory(id) {
        const historyDiv = document.getElementById(`history-${id}`);
        const icon = document.getElementById(`history-icon-${id}`);

        if (historyDiv) {
            if (historyDiv.classList.contains('hidden')) {
                historyDiv.classList.remove('hidden');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                historyDiv.classList.add('hidden');
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        }
    }

    toggleLoanDetails(id) {
        const detailsDiv = document.getElementById(`loan-details-${id}`);
        const toggleIcon = document.getElementById(`toggle-icon-${id}`);

        if (detailsDiv && toggleIcon) {
            if (detailsDiv.classList.contains('hidden')) {
                detailsDiv.classList.remove('hidden');
                toggleIcon.classList.remove('fa-chevron-down');
                toggleIcon.classList.add('fa-chevron-up');
            } else {
                detailsDiv.classList.add('hidden');
                toggleIcon.classList.remove('fa-chevron-up');
                toggleIcon.classList.add('fa-chevron-down');
            }
        }
    }

    updateStatistics() {
        const totalLoans = this.loans.length;
        const totalAmount = this.loans.reduce((sum, loan) => sum + loan.amount, 0);
        const unpaidCount = this.loans.filter(loan => !loan.paid).length;

        // Tính tổng tiền đã trả (dựa trên paidAmount thực tế)
        const totalPaidAmount = this.loans.reduce((sum, loan) => {
            return sum + (loan.paidAmount || 0);
        }, 0);

        // Tính tổng tiền chưa trả (tổng - đã trả)
        const totalUnpaidAmount = totalAmount - totalPaidAmount;

        document.getElementById('totalLoans').textContent = totalLoans;
        document.getElementById('totalAmount').textContent = new Intl.NumberFormat('vi-VN').format(totalAmount);
        document.getElementById('unpaidCount').textContent = unpaidCount;
        document.getElementById('unpaidAmount').textContent = new Intl.NumberFormat('vi-VN').format(totalUnpaidAmount);
        document.getElementById('paidAmount').textContent = new Intl.NumberFormat('vi-VN').format(totalPaidAmount);
    }
}

// Initialize the application
const loanManager = new LoanManager();
loanManager.initialize();
