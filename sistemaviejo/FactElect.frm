VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MsComCtl.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form FactElect 
   BackColor       =   &H80000007&
   Caption         =   "Relaciona Remitos con Factura Electronica"
   ClientHeight    =   6105
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   6945
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   6105
   ScaleWidth      =   6945
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   9
      Left            =   1800
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   840
      Width           =   975
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   285
      Left            =   5040
      TabIndex        =   4
      Top             =   840
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   5
      Left            =   5160
      TabIndex        =   7
      Text            =   "Text1"
      Top             =   1320
      Width           =   1335
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   4
      Left            =   2880
      TabIndex        =   6
      Text            =   "Text1"
      Top             =   1320
      Width           =   1575
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   960
      TabIndex        =   5
      Text            =   "Text1"
      Top             =   1320
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   2880
      TabIndex        =   3
      Text            =   "Text1"
      Top             =   840
      Width           =   1095
   End
   Begin VB.Frame Frame1 
      BackColor       =   &H80000012&
      Caption         =   "Remitos Pendientes de Facturar"
      ForeColor       =   &H0080C0FF&
      Height          =   3375
      Left            =   120
      TabIndex        =   9
      Top             =   1800
      Width           =   6615
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   8
         Left            =   5040
         TabIndex        =   18
         Text            =   "Text1"
         Top             =   2880
         Width           =   1335
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   7
         Left            =   2760
         TabIndex        =   17
         Text            =   "Text1"
         Top             =   2880
         Width           =   1575
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   6
         Left            =   840
         TabIndex        =   16
         Text            =   "Text1"
         Top             =   2880
         Width           =   1215
      End
      Begin MSComctlLib.ListView RemitosPendiente 
         Height          =   2415
         Left            =   240
         TabIndex        =   10
         Top             =   240
         Width           =   6135
         _ExtentX        =   10821
         _ExtentY        =   4260
         View            =   3
         MultiSelect     =   -1  'True
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         Checkboxes      =   -1  'True
         GridLines       =   -1  'True
         HotTracking     =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   5
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Nro Remito"
            Object.Width           =   1940
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Fecha"
            Object.Width           =   1940
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Total Neto"
            Object.Width           =   1940
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Total IVA"
            Object.Width           =   1940
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Total General"
            Object.Width           =   1764
         EndProperty
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Total"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   375
         Index           =   8
         Left            =   4440
         TabIndex        =   21
         Top             =   2880
         Width           =   1815
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "IVA"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   375
         Index           =   7
         Left            =   2280
         TabIndex        =   20
         Top             =   2880
         Width           =   2655
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Neto"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   375
         Index           =   6
         Left            =   120
         TabIndex        =   19
         Top             =   2880
         Width           =   1095
      End
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2520
      TabIndex        =   8
      Text            =   "Text1"
      Top             =   240
      Width           =   3975
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1560
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   240
      Width           =   855
   End
   Begin KewlButtonz.KewlButtons Aceptar 
      Height          =   735
      Left            =   960
      TabIndex        =   22
      Top             =   5280
      Width           =   1935
      _ExtentX        =   3413
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Grabar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "FactElect.frx":0000
      PICN            =   "FactElect.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Total"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Index           =   5
      Left            =   4560
      TabIndex        =   15
      Top             =   1320
      Width           =   2655
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "IVA"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Index           =   4
      Left            =   2400
      TabIndex        =   14
      Top             =   1320
      Width           =   2655
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Neto"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Index           =   3
      Left            =   240
      TabIndex        =   13
      Top             =   1320
      Width           =   1095
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fecha"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Index           =   2
      Left            =   4080
      TabIndex        =   12
      Top             =   840
      Width           =   2655
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Nro Fact Elect"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Index           =   1
      Left            =   240
      TabIndex        =   11
      Top             =   840
      Width           =   2655
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Empresa:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Index           =   0
      Left            =   240
      TabIndex        =   0
      Top             =   240
      Width           =   1335
   End
End
Attribute VB_Name = "FactElect"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim TotRem As Double
Dim TotNeto As Double
Dim TotIVa As Double


Private Sub Aceptar_Click()
If TotRem = Text1(5) Then
    ' graba factura en cuenta corriente
    Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
    With rsCtaCteEmp
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodEmp") = Text1(0)
        .Fields("PtoVta") = Text1(9)
        .Fields("NroComp") = Text1(2)
        .Fields("TipoComp") = 17
        .Fields("Debe") = FormatNumber(Text1(5))
        .Fields("SaldoComp") = FormatNumber(Text1(5))
        .Update
    End With
    'actualiza estado del remito
    i = 0
    For i = i + 1 To RemitosPendiente.ListItems.Count
        If RemitosPendiente.ListItems.Item(i).Checked = True Then
            Set rsEncabFact = db.OpenRecordset("Select * from EncabRemito where NroFact = " & RemitosPendiente.ListItems.Item(i).Tag & "")
            With rsEncabFact
                .Edit
                .Fields!Facturado = "SI"
                .Fields!PtoVta = Text1(9)
                .Fields!NroFactElect = Text1(2)
                .Update
            End With
        End If
    Next
End If

End Sub

Private Sub Form_Load()
i = 0
For i = i + 1 To Text1.Count
    Text1(i - 1) = ""
Next
Fecha.Mask = "##/##/####"
Text1(3) = "0.00"
Text1(4) = "0.00"
Text1(5) = "0.00"
Text1(6) = "0.00"
Text1(7) = "0.00"
Text1(8) = "0.00"
TotRem = 0
TotNeto = 0
TotIVa = 0

End Sub

Private Sub RemitosPendiente_ItemCheck(ByVal Item As MSComctlLib.ListItem)
If RemitosPendiente.ListItems.Item(RemitosPendiente.SelectedItem.Index).Checked = True Then
    Set Lista = RemitosPendiente.ListItems.Item(RemitosPendiente.SelectedItem.Index)
    TotNeto = TotNeto + Lista.SubItems(2)
    Text1(6) = FormatNumber(TotNeto)
    TotIVa = TotIVa + Lista.SubItems(3)
    Text1(7) = FormatNumber(TotIVa)
    TotRem = TotRem + Lista.SubItems(4)
    Text1(8) = FormatNumber(TotRem)
Else
    Set Lista = RemitosPendiente.ListItems.Item(RemitosPendiente.SelectedItem.Index)
    TotNeto = TotNeto - Lista.SubItems(2)
    Text1(6) = FormatNumber(TotNeto)
    TotIVa = TotIVa - Lista.SubItems(3)
    Text1(7) = FormatNumber(TotIVa)
    TotRem = TotRem - Lista.SubItems(4)
    Text1(8) = FormatNumber(TotRem)
End If
End Sub

Private Sub Text1_GotFocus(Index As Integer)
Text1(Index).SelStart = 0
    Text1(Index).SelLength = Len(Text1(Index).Text)
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
    Case 0:
        If Not Text1(0) = "" Then
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(0) & "")
            Text1(1) = rsEmpresas!DEscEmpresas
            Set rsEncabFact = db.OpenRecordset("Select * From EncabRemito WHERE Codigo = " & Text1(0) & " AND Facturado = 'NO'")
            RemitosPendiente.ListItems.Clear
            Do While Not rsEncabFact.EOF
                Set Lista = RemitosPendiente.ListItems.Add(, , rsEncabFact!NroFact)
                Lista.Tag = rsEncabFact!NroFact
                Lista.SubItems(1) = rsEncabFact!Fecha
                Lista.SubItems(2) = rsEncabFact!TNeto
                Lista.SubItems(3) = rsEncabFact!TIVA
                Lista.SubItems(4) = rsEncabFact!TGral
                rsEncabFact.MoveNext
            Loop
                
        End If
End Select
        
End Sub
